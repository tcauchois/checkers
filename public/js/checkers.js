//draw the board
function drawBoard(canvas) {
  for(var i=0;i<8;i++) {
    for(var j=0;j<8;j++) {
      if((i % 2) == (j % 2)) { canvas.fillStyle = "white"; }
      else { canvas.fillStyle = "grey"; }
      canvas.fillRect(i*50, j*50, 50, 50);
    }
  }
}
//draw the pieces
function drawPieces(canvas, pieces) {
  for(var i=0;i<pieces.length;i++) {
    if(pieces[i]['x'] == -1) { continue; }
    canvas.fillStyle = pieces[i]['team'];
    canvas.beginPath();
    canvas.arc(pieces[i]['x'] * 50 + 25, pieces[i]['y'] * 50 + 25, 25, 0, 2 * Math.PI, false);
    canvas.fill();
    canvas.closePath();
  }
}
//draw the selection
function drawSelection(canvas, selection) {
  canvas.strokeStyle = "lime";
  canvas.lineWidth = 2;
  canvas.beginPath();
  canvas.rect(selection['x'] * 50, selection['y'] * 50, 50, 50);
  canvas.stroke();
  canvas.closePath();
}

//global state
var color = "";
var socket = null;
var connected = false;
var pieces = null;
var myturn = false;
var selection = {'x': -1, 'y': -1};
var canvas = null;

function redrawGame() {
  if(canvas != null) {
    drawBoard(canvas);
    if(pieces != null) {
      drawPieces(canvas, pieces);
    }
    if(selection['x'] != -1) {
      drawSelection(canvas, selection);
    }
  }
}

//selection event
function selectPiece(e) {
  var x = Math.floor((e.pageX - $('#board').offset().left) / 50);
  var y = Math.floor((e.pageY - $('#board').offset().top) / 50);

  if(connected && myturn) {
    if(selection['x'] == -1) {
      for(var i=0;i<pieces.length;i++) {
        if(pieces[i]['x'] == x && pieces[i]['y'] == y && pieces[i]['team'] == color) {
          selection = {'x': x, 'y': y};
          redrawGame();
          break;
        }
      }
    } else {
      var move = {'start': {'x': selection['x'], 'y': selection['y']}, 'end': {'x': x, 'y': y}};
      if(validateMove(pieces, color, move, false)) {
        selection = {'x': -1, 'y': -1};
        redrawGame();
        socket.emit('move', move);
      } else if(selection['x'] == x && selection['y'] == y) {
        selection = {'x': -1, 'y': -1};
        redrawGame();
      }
    }
  }
}

function sendColor(socket) {
  color = window.location.pathname.replace(/^\//, "").split('/')[0];
  socket.emit('notifyColor', color);
}
function receiveCList(playerState) {
  $('div#redStatus').text(playerState['red'] ? "connected" : "disconnected");
  $('div#blackStatus').text(playerState['black'] ? "connected" : "disconnected");
}

function log(msg) {
  $('div#log').text(msg);
}

function restart() {
  if(connected) { socket.emit('restart'); }
}

function init() {
  canvas = document.getElementById('board').getContext("2d");
  redrawGame();
  $('#board').click(selectPiece);
  $('#restart').click(restart);
  receiveCList({'black': false, 'red': false});
  log("Trying to connect to server...");
  socket = io.connect(window.location.origin);
  socket.on('connect', function() {
    sendColor(socket);
    connected = true;
  });
  socket.on('notifyClients', function(playerState) {
    receiveCList(playerState);
  });
  socket.on('notifyState', function(state) {
    if(state['won']['red']) {
      if(state['won']['black']) { log("Tied game"); }
      else { log("Red won"); }
    } else if(state['won']['black']) { log("Black won"); }
    else { log("Next: " + state['turn']); }
    pieces = state['pieces'];
    myturn = state['turn'] == color && !state['won']['red'] && !state['won']['black'];
    selection = {'x': -1, 'y': -1};
    redrawGame();
  });
  socket.on('disconnect', function() {
    connected = false;
    receiveCList({'black': false, 'red': false});
    log("Trying to connect to server...");
    selection = {'x': -1, 'y': -1};
    redrawGame();
  });
}

$(function() {
  init();
});
