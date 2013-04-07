function generateBoard() {
    pieces = [];
    for(var i = 0; i < 4; i++) {
      for(var j = 0; j < 3; j++) {
        pieces.push({ 'x': i*2+1-(j%2), 'y': j, 'team': 'black', 'king': false });
        pieces.push({ 'x': i*2+(j%2), 'y': 7-j, 'team': 'red', 'king': false });
      }
    }
  return pieces;
}

function findPcIndex(pieces, x, y) {
  for(var i=0;i<pieces.length;i++) {
    if(pieces[i]['x'] == x && pieces[i]['y'] == y)
      return i;
  }
  return -1;
}

function checkForWin(pieces, team) {
  var enemy = (team == "red") ? "black" : "red";
  for(var i=0;i<pieces.length;i++) {
    if(pieces[i]['team'] == enemy && pieces[i]['x'] != -1)
      return false;
  }
  return true;
}

function validateMove(pieces, turn, move, update) {
  var srcIndex = findPcIndex(pieces, move['start']['x'], move['start']['y']);
  var dstIndex = findPcIndex(pieces, move['end']['x'], move['end']['y']);
  //if we can't find the "start" location, it's a bad move
  if(srcIndex == -1) { return false; }
  //if the "start" location is the wrong color, it's a bad move
  if(pieces[srcIndex]['team'] != turn) { return false; }
  //if the "end" location is occupied, it's a bad move
  if(dstIndex != -1) { return false; }
  var fwd = (turn == "red") ? -1 : 1;
  var last = (turn == "red") ? 0 : 7;
  var enemy = (turn == "red") ? "black" : "red";
  //allow diagonal moves: x,y -> x-1,y+fwd or x+1,y+fwd
  //(or y-fwd for king)
  if((move['start']['y'] + fwd == move['end']['y'] ||
     (move['start']['y'] - fwd == move['end']['y'] && pieces[srcIndex]['king'])) &&
     (move['start']['x'] + 1 == move['end']['x'] ||
      move['start']['x'] - 1 == move['end']['x'])) {
    if(update) {
      pieces[srcIndex]['x'] = move['end']['x'];
      pieces[srcIndex]['y'] = move['end']['y'];
      if(pieces[srcIndex]['y'] == last)
        pieces[srcIndex]['king'] = true;
    }
    return true;
  }
  //todo: allow forward jumps: x,y -> x-2, y+2fwd or x+2, y+2fwd (over enemy pc)
  //kings get backwards, too: y-2fwd
  if((move['start']['y'] + 2*fwd == move['end']['y'] ||
     (move['start']['y'] - 2*fwd == move['end']['y'] && pieces[srcIndex]['king'])) &&
     (move['start']['x'] + 2 == move['end']['x'] ||
      move['start']['x'] - 2 == move['end']['x'])) {
    var midx = (move['start']['x'] + move['end']['x']) / 2;
    var midy = (move['start']['y'] + move['end']['y']) / 2;
    var mididx = findPcIndex(pieces, midx, midy);
    if(mididx == -1 || pieces[mididx]['team'] != enemy)
      return false;
    if(update) {
      pieces[srcIndex]['x'] = move['end']['x'];
      pieces[srcIndex]['y'] = move['end']['y'];
      if(pieces[srcIndex]['y'] == last)
        pieces[srcIndex]['king'] = true;
      pieces[mididx]['x'] = pieces[mididx]['y'] = -1;
    }
    return true;
  }

  //otherwise, it's a bad move
  return false;
}

(function() {
  try {
  module.exports.generateBoard = generateBoard;
  module.exports.validateMove = validateMove;
  module.exports.checkForWin = checkForWin;
  } catch(err) { }
})();
