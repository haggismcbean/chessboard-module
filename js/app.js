//TODO: Retrieve positions from the database
var position = {
  FEN: 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4',
  moves: [
    "a6", 
    "Ba4",
    "b5"
  ],
  toMove: 'black'
}

Moves = function(moves) {
  var self = this;
  self.moves = moves;

  self.isCorrectMove = function(history) {
    self.guess = history[history.length - 1];
    self.numberMoves = history.length - 1;
    self.correctMove = self.moves[self.numberMoves];

    if (self.guess === self.correctMove) {
      return true;
    }
    return false;
  }

  self.isAcceptedVariation = function() {
    //TODO: THIS
    return false;
  }

  self.isRejectedVariation = function() {
    //TODO: THIS
    return false;
  }

  self.isEnd = function() {
    if (self.numberMoves === self.moves.length - 1) {
      return true;
    } else {
      return false;
    }
  }

  self.getNextMove = function() {
    return self.moves[self.numberMoves + 1];
  }
}

Controller = function(position) {
  var self = this;
  self.FEN = position.FEN;
  self.moves = new Moves(position.moves);

  self.init = function() {
    self.game = new Chess();
    self.game.load(self.FEN);
  }

  self.handleDrag = function(source, piece, position, orientation) {
    if (self.game.game_over() === true ||
      (self.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (self.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
    return true
  }

  self.isLegal = function(source, target) {
    var playersGuess = {
      from: source,
      to: target,
      promotion: 'q' // TODO: offer and then handle underpromotion
    }

    var move = self.game.move(playersGuess);

    if (move === null) {
      return false;
    }
    return true;
  }

  self.handleDrop = function(source, target) {
    if (!self.isLegal(source, target)){
      return 'snapback';
    }

    var history = controller.game.history();

    if (self.moves.isCorrectMove(history)) {
      self.handleCorrectMove()
    } else {
      self.handleWrongMove();
    }
  }

  self.handleCorrectMove = function(history, game, numberMoves, correctMove) {
    if (self.moves.isEnd()) {
      console.log('end - all moves correct');
    } else {
      self.makeNextMove();
    }
  }

  self.makeNextMove = function() {
    var nextMove = self.moves.getNextMove();
    self.game.move(nextMove);
  }

  self.handleWrongMove = function() {
    console.log('wrong!');
  }

  self.onSnapEnd = function() {
    board.position(self.game.fen());
  }

  self.init();
}

BoardConfig = function(position, orientation) {
  var self = this;

  self.draggable = true;

  self.position = position;

  self.orientation = orientation;

  self.onDragStart = function(source, piece, position, orientation) {
    return controller.handleDrag(source, piece, position, orientation);
  };

  self.onDrop = function(source, target) {
    controller.handleDrop(source, target);
  };

  self.onSnapEnd = function() {
    controller.onSnapEnd();
  }
}

var board;
var controller = new Controller(position);
var config = new BoardConfig(position.FEN, position.toMove);

board = ChessBoard('board', config);

