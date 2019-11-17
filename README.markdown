typeto.me
---------

typeto.me is a character-level realtime chat, like the old talk program on Unix
and Unix-like operating systems.

This is made possible via [socket.io](http://socket.io) and Google's [js diff library](http://code.google.com/p/google-diff-match-patch/).

# installation

`git clone https://github.com/lysol/typeto.me`
`cd typeto.me`

`npm install`
`<modify config.json-dist with values for your deployment and move to config.json>`
`node app.js`


# todo
- [ ] rewrite frontend coffeescript and split it out from layout.eco

- [x] get rid of eco templates, replace with simple JS global var injection

(C) 2016 Derek Arnold under the MIT License

Derek did all the work; [Daniel](http://3e.org/dmd/) nagged him to do it. [Daniel](http://3e.org/dmd/) then bugged [Jordan](http://jordanbyrd.com) to update it in 2016.

[See it live](http://typeto.me/)

