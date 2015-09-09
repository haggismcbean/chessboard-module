//TODO: Retrieve positions from the database
pgn = ['[Event "Casual Game"]',
       '[Site "Berlin GER"]',
       '[Date "1852.??.??"]',
       '[EventDate "?"]',
       '[Round "?"]',
       '[Result "1-0"]',
       '[White "Adolf Anderssen"]',
       '[Black "Jean Dufresne"]',
       '[ECO "C52"]',
       '[WhiteElo "?"]',
       '[BlackElo "?"]',
       '[PlyCount "47"]',
       '[SetUp "1"]',
       '[FEN r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4]',
       '',
       '1.a6 Ba4 2.b5'
      ];

var pgnString = pgn.join('\n');

MovesDisplay = function(moves) {
  var self = this;
  var moves = moves.moves;

  self.init = function() {
    $("body").append("<div class='moves-display'></div>");
    self.$main = $(".moves-display");
    populate();
    self.hideMoves();
  }

  self.showMoves = function() {
    self.$main.show();
  }

  self.hideMoves = function() {
    self.$main.hide();
  }

  function populate() {
    for (var i=0; i < moves.length; i++) {
      self.$main.append("<div class='move' id='move-" + i + "'>" + moves[i].action + "</div>")
      var $thisMove = $("#move-" + i);
    }
  }

  self.init();
}

Feedback = function() {
  var self = this;

  self.init = function() {
    $("body").append("<div class='feedback'></div>");
    self.$feedback = $(".feedback");
  }

  self.showRight = function() {
    self.$feedback.text("CORRECT");
  }

  self.showWrong = function() {
    self.$feedback.text("WRONG");
  }

  self.init();
}

Moves = function(history, startingFen) {
  var self = this;
  self.moves = [];
  self.history = history;
  self.startingFen = startingFen;

  self.init = function() {
    populateMoves();
  }

  self.currentMove = function() {
    for (var i=0; i < self.moves.length; i++) {
      if (self.moves[i].toGuess) {
        return self.moves[i];
      }
    }
    return false;
  }

  self.isCorrectMove = function(move) {
    var currentMove = self.currentMove();

    if (move === currentMove.action) {
      return true;
    }

    return false;
  }

  self.saveComputerMoveFen = function(fen) {
    for (var i=0; i < self.moves.length; i++) {
      if (self.moves[i].toGuess) {
        self.moves[i-1].fen = fen;
      }
    }
  }

  self.computerReply = function(fen) {
    for (var i=0; i < self.moves.length; i++) {
      if (self.moves[i].toGuess == true) {
        self.moves[i].toGuess = false;
        self.moves[i].fen = fen;

        if (self.moves[i+2]) {
          self.moves[i+2].toGuess = true;
        }

        return self.moves[i+1].action;
      }
    }
    return false;
  }

  self.isEnd = function() {
    var currentMove = self.currentMove();
    var index = self.moves.length - 1;

    if (currentMove === self.moves[index]) {
      return true;
    }

    return false;
  }

  function populateMoves() {
    for (var i=0; i < self.history.length; i++) {

      var move = {
        action: self.history[i],
        toGuess: false,
      }
      self.moves.push(move);
    }

    self.moves[0].toGuess = true;
  }

  self.init();
}

Controller = function(pgn, startingPosition) {
  var self = this;
  self.pgn = pgn;
  self.startingFen = startingPosition;
  self.currentFen = startingPosition;

  self.init = function() {
    self.game = new Chess();
    self.game.load_pgn(self.pgn);

    self.moves = new Moves(self.game.history(), self.currentFen);

    self.game.load(self.currentFen);

    self.orientation = toMove();
    
    var config = new BoardConfig(self.currentFen, self.orientation);
    self.board = ChessBoard('board', config);

    self.movesDisplay = new MovesDisplay(self.moves);
    self.feedback = new Feedback();
  }

  function toMove() {
    if (self.game.turn() === 'b') {
      return 'black';
    }
    return 'white';
  }

  self.handleDrag = function(source, piece, position, orientation) {
    if (self.game.game_over() === true ||
      (self.game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (self.game.turn() === 'b' && piece.search(/^w/) !== -1)) {
      return false;
    }
    return true
  }

  self.handleDrop = function(source, target) {
    if (!self.makeMove(source, target)){
      return 'snapback';
    }

    var history = controller.game.history();
    var index = history.length - 1;
    var currentMove = history[index];

    if (self.moves.isCorrectMove(currentMove)) {
      self.handleCorrectMove()
    } else {
      self.handleWrongMove();
    }
  }

  self.makeMove = function(source, target) {
    var playersGuess = {
      from: source,
      to: target,
      promotion: 'q' // TODO: offer and then handle underpromotion
    }

    var move = self.game.move(playersGuess);
    self.currentFen = self.game.fen();

    if (move === null) {
      return false;
    }

    return true;
  }

  self.handleCorrectMove = function(history, game, numberMoves, correctMove) {
    if (self.moves.isEnd()) {
      self.movesDisplay.showMoves();
      self.feedback.showRight();
    } else {
      self.makeNextMove();
    }
  }

  self.makeNextMove = function() {
    var nextMove = self.moves.computerReply(self.currentFen);
    self.game.move(nextMove);
    self.moves.saveComputerMoveFen(self.game.fen());
  }

  self.handleWrongMove = function() {
    self.movesDisplay.showMoves();
    self.feedback.showWrong();
  }

  self.onSnapEnd = function() {
    self.board.position(self.game.fen());
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

var controller = new Controller(pgnString, 'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 0 4');
