express = require("express");
app = express();
http = require("http");
server = http.createServer(app);
io = require("socket.io").listen(server);
server.listen(9000);

io.set('close timeout', 3000);
io.set('heartbeat timeout', 20);
io.set('heartbeat interval', 5);
io.set('log level', 2);

app.get("/red(/?)", function(req, res) { res.sendfile('public/index.html'); });
app.get("/black(/?)", function(req, res) { res.sendfile('public/index.html'); });
app.use("/js", express.static('public/js'));

clients = {};
function sendClientList() {
  cs = { 'black': false, 'red': false };
  for(var cl in clients) {
    if(clients[cl] in cs) cs[clients[cl]] = true;
  }
  io.sockets.emit('notifyClients', cs);
}

game = require("./public/js/game");
function generateState() {
  return { 'pieces': game.generateBoard(),
    'turn': 'red',
    'won': { 'black': false, 'red': false }
  };
}
state = generateState();

io.sockets.on('connection', function(client) {

  client.emit('notifyState', state);

  client.on('move', function(move) {
    if(state['won']['red'] || state['won']['black']) {
      console.log("Ignoring move from player " + client.id + " after game end");
    } else if(game.validateMove(state['pieces'], state['turn'], move, true)) {
      console.log("Player " + client.id + " moved (" + move['start']['x'] +
        "," + move['start']['y'] + ") -> (" + move['end']['x'] + "," +
        move['end']['y'] + ")");
      state['turn'] = (state['turn'] == "red") ? "black" : "red";
      state['won']['red'] = game.checkForWin(state['pieces'], 'red');
      state['won']['black'] = game.checkForWin(state['pieces'], 'black');
      io.sockets.emit('notifyState', state);
    } else {
      console.log("Player " + client.id + " attempted invalid move (" + move['start']['x'] +
        "," + move['start']['y'] + ") -> (" + move['end']['x'] + "," +
        move['end']['y'] + ")");
    }
  });

  client.on('notifyColor', function(color) {
    clients[client.id] = color;
    sendClientList();
    console.log("Player " + client.id + " joined team " + color);
  });
  client.on('restart', function() {
    state = generateState();
    io.sockets.emit('notifyState', state);
    console.log("Player " + client.id + " restarted game.");
  });
  client.on('disconnect', function() {
    delete clients[client.id];
    sendClientList();
    console.log("Player " + client.id + " disconnected");
  });
});
