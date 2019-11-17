module.exports = (opts) => console.log('jab', opts) || `<!DOCTYPE html>
<html>
  <head>
    <title>typeto.me</title>
    <meta charset="utf-8" />
    <meta name="description" content="Talk in actual real time." />
    <link href='http://fonts.googleapis.com/css?family=Anonymous+Pro' rel='stylesheet' type='text/css'>
    <script src="/bower_components/socket.io-client/socket.io.js"></script>
    <script src="/js/diff_match_patch.js"></script>
    <script src="/js/coffee-script.js"></script>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js"></script>
    <script type="text/javascript" src="/js/jquery.color.js"></script>
    <script type="text/coffeescript">
        socket = null
        lastInput = ""
        dmp = new diff_match_patch()
        waitingfor = true
        talkbox = null
        otherbox = null
        inputmax = 58

        $.prototype.setBoxColor = (color) ->
          prop = backgroundColor: color
          @animate prop, 200

        $.prototype.scrollBottom = ->
          @[0].scrollTop = @[0].scrollHeight

        drainBuffer = ->
          ib = ($ '#input-box')
          ip = ($ '#input-scrollback')
          p = $ "<p></p>"
          p.text ib.val()
          p.insertBefore $('#input-box')
          ib.val ''
          lastInput = ""
          socket.emit 'newline', token: '${opts.room}'
          ip.scrollBottom()

        sendBuffer = ->
          curbuf = $('#input-box').val()
          socket.emit 'resetBuffer',
            currentBuffer: curbuf
            token: '${opts.room}'

        handleResetBuffer = (data) ->
          if data? and data.currentBuffer?
            otherscrollback = ($ "#other-scrollback")
            lines = otherscrollback.children()
            cur = lines[lines.length - 1]
            cur.textContent = data.currentBuffer

        handlePartnerJoin = (data) ->
          enableInput()
          if waitingfor
            osb = ($ '#other-scrollback')
            osb.empty()
            waitingfor = false
          insertNotice 'User connected.'
          sendBuffer()

        handleDenyJoin = ->
          tb = ($ '#you-box')
          bb = ($ '#them-box')
          if tb?
            tb.remove()
          if bb?
            bb.remove()
          b = ($ 'body')
          b.html '''
            <p>Two people are already talking here. Did someone forget to close a window?</p><p><a href="/">Try starting a new chat.</a></p>'''
          

        removeCurrentLineClass = (scrollbackElem) ->
          ps = scrollbackElem.children 'p.current-line'
          for cp in ps
            $(ps).removeClass 'current-line'

        insertNotice = (message) ->
          osb = ($ '#other-scrollback')
          removeCurrentLineClass osb
          dnotice = ($ "<p class=\\"notice\\">#{message}</p><p class=\\"current-line\\"></p>")
          osb.append dnotice

        disableInput = ->
          ib = $('#input-box')
          ib[0].blur()
          ib.attr 'disabled', true
          otherbox.setBoxColor '#DDDDDD'
          ib.attr 'placeholder', 'Waiting for a friend to come back.'
          ibb = ib.parent '.talkbox'

        enableInput = ->
          ib = $('#input-box')
          ib.attr 'disabled', false
          otherbox.setBoxColor '#FFFFFF'
          ib.attr 'placeholder', 'Just start typing.'
          ib[0].focus()

        handleUserDisconnect = (data) ->
          insertNotice 'User disconnected.'
          disableInput()

        forceSend = ->
          ib = $ '#input-box'
          words = ib.val().split ' '
          ib.val words[0..words.length - 2].join ' '
          doDiff ib.val()
          drainBuffer()
          if words.length > 1
            ib.val words[words.length - 1]
          doDiff ib.val()

        doDiff = (val) ->
          oldInput = lastInput
          lastInput = val
          if oldInput == lastInput
            return
          res = dmp.patch_make(oldInput, val)
          socket.emit 'diff', diff: res, token: '${opts.room}'
          #diffBox res, ($ '#input-scrollback')

        handleNewline = ->
          osb = ($ '#other-scrollback')
          removeCurrentLineClass osb
          osb.append ($ '<p class="current-line"></p>')
          osb.scrollBottom()

        diffBox = (diff, scrollback=($ "#other-scrollback")) ->
          lines = scrollback.children()
          old = lines[lines.length - 1]
          res = dmp.patch_apply diff, old.textContent
          old.textContent = res[0]
          scrollback.scrollBottom()

        handleDiff = (diff) -> diffBox diff

        letters = 'abcdefghkmnpqrstuvwxyz23456789'
        sendJoin = (e) ->
          token = ''
          for num in [1..6]
            token += letters[Math.floor(Math.random() * letters.length)]
          window.location = "/#{token}"
          false

        ($ document).keydown (ev) ->
          if ev.target == @ or (ev.ctrlKey? and ev.ctrlKey)
            return true
          ibfocused = $('#input-box').data 'focused'
          if not ibfocused? or not ibfocused
            ($ '#input-box').focus()
            doitman = -> $('#input-box').trigger ev
            setTimeout doitman, 100
          return true

        ($ document).ready () ->
          ${ opts.config.publicPort ? 
          `socket = io.connect "http://${opts.config.publicHost}:${opts.config.publicPort + 1}"` :
          `socket = io.connect "http://${opts.config.publicHost}"`
          }
          socket.on 'joinResponse', (data) ->
            handleJoinResponse data

          socket.on 'partnerJoin', handlePartnerJoin
          socket.on 'userDisconnect', handleUserDisconnect
          socket.on 'denyJoin', handleDenyJoin 
          socket.on 'newline', handleNewline
          socket.on 'kick', (data) ->
          socket.on 'resetBuffer', handleResetBuffer
          socket.on 'diff', (data) -> handleDiff data.diff

          ${opts.home ?
          `chatButton = ($ '#chat')
          chatButton.bind 'click', sendJoin` :
          
          `otherbox = ($ '#them-box')
          talkbox = ($ '#you-box')
          if not talkbox?
            window.location = "/"
          if not talkbox?
            window.location = "/"
          talkbox.html """
            <div class="scrollback" id="input-scrollback">
                <input class="chat" placeholder="Waiting for your friend to arrive." id="input-box">
            </div>
            """
          ib = ($ "#input-box")
          ib.data 'focused', false
          ib.attr 'disabled', true
          ib.keydown (ev) ->
            keycode = ev.charCode || ev.keyCode
            if keycode != 13
              if ev.target == @
                return true
              return false
            drainBuffer()
            if ev.target == @
              return true
            return false

          ib.focus (ev) ->
            $(@).data 'focused', true

          ib.blur (ev) ->
            $(@).data 'focused', false

          ib.bind 'keyup change', (ev) ->
            doDiff ib.val()
            if ib.val().length >= inputmax
              forceSend()
            true

          otherbox.html '''
            <div class="scrollback" id="other-scrollback">
            <p>
            Give your friend this link:
<a id="publiclink" href="`+opts.publicLink+`">`+opts.publicLink+`</a> <!-- <a href="#" id="copy-publiclink">[copy]</a> -->

            </p>
            </div>
            '''

          if ${opts.otherUserJoined}
            handlePartnerJoin()
          talkbox.setBoxColor '#FFFFFF'
          socket.emit 'requestJoin', token: '${opts.room}'`}
          
    </script>
    <style type="text/css">
        body {
            margin: 0;
            padding: 0;
            font-family: 'Anonymous Pro', monospace;
            position: relative;
            font-size: 16px;
            line-height: 18px;
        }
        #container {
            margin: auto;
            margin-top: 2em;
            width: 40em;
        }
        .talkbox {
            padding: 3em;
            border: 1px solid #000000;
            height: 14.3em;
            padding-top: 2em;
            margin-left: auto;
            margin-right: auto;
        }
        #them-box {
            border-bottom: 0;
            webkit-border-top-left-radius: 5px;
            webkit-border-top-right-radius: 5px;
            moz-border-top-left-radius: 5px;
            moz-border-top-right-radius: 5px;
            border-top-right-radius: 5px;
            border-top-left-radius: 5px;
            background-color: #DDDDDD;
            position: relative;
        }
        #you-box {
            webkit-border-bottom-left-radius: 5px;
            webkit-border-bottom-right-radius: 5px;
            moz-border-bottom-left-radius: 5px;
            moz-border-bottom-right-radius: 5px;
            border-bottom-right-radius: 5px;
            border-bottom-left-radius: 5px;
            background-color: #DDDDDD;
        }

        .scrollback {
            overflow: auto;
            height: 14.8375em;
        }

        #other-scrollback {
            height: 15.8375em;
        }

        .scrollback p {
            margin: 0;
            padding-left: 1px;
            padding-top: 2px;
        }

        #input-box {
            border: 0 #FFFFFF solid;
            background-color: #FFFFFF;
            width: 99%;
            font-family: 'Anonymous Pro', monospace;
            font-size: 16px;
            bottom: 1em;
            left: auto;
            color: #000000;
            wrap: physical;
            outline: none;
        }

        #input-box:focus {
            outline: none;
        }

        #homehome {
            margin: auto;
            margin-top: 5em;
            width: 25em;
            text-align: center;
        }
        #homehome p {
            padding-top: 1em;
        }
        a#chat, a#chat:visited {
            font-size: 1.5em;
            color: #6E6E6E;
            border: 1px solid #DCDCDC;
            webkit-border-radius: 4px;
            moz-border-radius: 4px;
            border-radius: 4px;
            padding: 0.75em;
            padding-right: 0.85em;
            padding-left: 0.85em;
            background-color: #F3F3F3;
            cursor: auto;
            text-decoration: none;
            font-weight: bold;
            display: block;
            clear: both;
            width: 6.5em;
            margin: auto;
        }

        a#chat:hover {
            border: 1px solid #989898;
            color: #2A2A2A;
        }

        .notice {
            font-weight: bold;
            color: #AFAFAF;
        }

    </style>
  </head>
<body>
${opts.body && opts.body}
${opts.config.analyticsCode && `
<script type="text/javascript">

  var _gaq = _gaq || [];
  _gaq.push(['_setAccount', '${opts.config.analyticsCode}']);
  _gaq.push(['_trackPageview']);

  (function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
  })();

</script>`}
</body>
</html>`;

