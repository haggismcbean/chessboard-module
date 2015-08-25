//so from the database we receive a fen (of the starting position), and a list of the expected moves and variations

var ruyLopez = 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R';

var position = {
  FEN: ruyLopez,
  moves: [
    "a6", 
    "Ba4",
    "b5"
  ]
}

var board,
game = new Chess(),
statusEl = $('#status'),
fenEl = $('#fen'),
pgnEl = $('#pgn');
game.load(position.FEN + ' b KQkq - 0 4')

// do not pick up pieces if the game is over
// only pick up pieces for the side to move
var onDragStart = function(source, piece, position, orientation) {
  if (game.game_over() === true ||
      (game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false;
  }
};

var onDrop = function(source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for example simplicity
  });

  // illegal move
  if (move === null) return 'snapback';

  checkAgainstMoves();

  updateStatus();
};

// update the board position after the piece snap 
// for castling, en passant, pawn promotion
var onSnapEnd = function() {
  board.position(game.fen());
};

var checkAgainstMoves = function() {
  var history = game.history();
  var guess = history[history.length - 1];
  var numberMoves = history.length - 1;
  var correctMove = position.moves[numberMoves];

  if (guess === correctMove) {
    //either we show the new position and wait for the player to make another move, or if it's the end then we show feedback
    handleCorrectMove(history, game, numberMoves, correctMove);
  } else {
    //show feedback
    handleWrongMove();
  }
}

var handleCorrectMove = function(history, game, numberMoves, correctMove) {
  if (numberMoves === position.moves.length - 1) {
    //show correct feedback, and load next position
    console.log('end - all moves correct');
  } else {
    makeNextMove(history, game, numberMoves, correctMove)
  }
}

var makeNextMove = function(history, game, numberMoves, correctMove) {
  var nextMove = position.moves[numberMoves + 1];
  game.move(nextMove);
}

var handleWrongMove = function() {
  console.log('wrong!');
}

var updateStatus = function() {
  var status = '';

  var moveColor = 'White';
  if (game.turn() === 'b') {
    moveColor = 'Black';
  }

  // checkmate?
  if (game.in_checkmate() === true) {
    status = 'Game over, ' + moveColor + ' is in checkmate.';
  }

  // draw?
  else if (game.in_draw() === true) {
    status = 'Game over, drawn position';
  }

  // game still on
  else {
    status = moveColor + ' to move';

    // check?
    if (game.in_check() === true) {
      status += ', ' + moveColor + ' is in check';
    }
  }

  statusEl.html(status);
  fenEl.html(game.fen());
  pgnEl.html(game.pgn());
};

var cfg = {
  draggable: true,
  position: position.FEN,
  orientation: 'black',
  onDragStart: onDragStart,
  onDrop: onDrop,
  onSnapEnd: onSnapEnd
};
board = ChessBoard('board', cfg);

updateStatus();

