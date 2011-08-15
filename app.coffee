express = require 'express'
app = module.exports = express.createServer()
io = (require 'socket.io').listen(app)
fs = require 'fs'
eco = require 'eco'

config = {}

class Client
  constructor: (@name, @socket) ->

  emit: (eventType, payload) -> @socket.emit eventType, payload


class Room
  constructor: (@token, @top=null, @bottom=null) ->

rooms = []

getRoom = (token) ->
  for room in rooms
    if room.token == token
      return room

roomRoute = (event, data, user) ->
  room = getRoom data.token
  if not room?
    return
  if room.top != user and room.bottom != user
    console.log "Incorrect user"
    return
  if room.top == user and room.bottom? and room.bottom.socket?
    room.bottom.socket.emit event, data
    console.log "top == user"
  else if room.top? and room.top.socket?
    room.top.socket.emit event, data
    console.log "bottom == user"


# Setup Template Engine
app.set 'views', __dirname + '/views'
app.set 'view engine', 'eco'
app.set 'view options', layout: 'layout'
app.use express.bodyParser()
app.use express.methodOverride()
app.use express.cookieParser()
app.use app.router

# Setup Static Files
app.use express.static __dirname + '/public'

app.get '/', (request, response) ->
  response.render 'home',
    "config": config

app.get '/room/:token', (request, response) ->
  token = request.params.token
  droom = getRoom token
  if not droom?
    rooms.push new Room 
  uPos = if not droom? or not droom.top? then 0 else 1
  otherUserJoined = droom? and (droom.top? or droom.bottom?)
  response.render 'room',
    userPosition: uPos
    "otherUserJoined": otherUserJoined
    room: token
    "config": config

app.get '/start', (request, response) ->

randomName = -> 'Anonymous'

start = (err, data) ->
  if err?
    console.log "Error reading config.json"
    throw err
  config = JSON.parse(data.replace "\n", "")
  if not config.publicHost?
    config.publicHost = 'localhost'
  if not config.publicPort?
    config.publicPort = 3000
  app.listen config.port, config.host
  io.sockets.on 'connection', (socket) ->
    user = new Client(randomName(), socket)
    socket.on 'requestJoin', (data) ->
      if not (data? and data.token?)
        return
      room = getRoom data.token
      if not room?
        room = new Room data.token
        rooms.push room
      if not room.top?
        room.top = user
        if room.bottom?
          room.bottom.socket.emit 'partnerJoin', user.name
      else if not room.bottom?
        room.bottom = user
        if room.top?
          room.top.socket.emit 'partnerJoin', user.name
      else
        socket.emit 'denyJoin', data.token

    socket.on 'newline', (data) ->
      if not (data? and data.token?)
        return
      roomRoute 'newline', data, user

    socket.on 'diff', (data) ->
      if not (data? and data.diff? and data.token?)
        return
      roomRoute 'diff', data, user

    socket.on 'resetBuffer', (data) ->
      console.log 'Received resetBuffer'
      console.log data

      if not (data? and data.currentBuffer? and data.token?)
        return
      roomRoute 'resetBuffer', data, user

    socket.on 'disconnect', () ->
      for i in [0...rooms.length]
        room = rooms[i]
        if not room?
          # Basically, this was already removed.
          return
        if room.top == user
          if room.bottom?
            room.bottom.socket.emit 'userDisconnect', {}
            room.top = null
          else
            rooms.splice i, 1
        else if room.bottom == user
          if room.top?
            room.top.socket.emit 'userDisconnect', {}
            room.bottom = null
          else
            rooms.splice i, 1

  console.log "Listening on #{config.host}:#{config.port}"
fs.readFile __dirname + '/config.json', 'utf8', start