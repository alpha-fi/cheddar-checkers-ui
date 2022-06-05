window.onload = function () {
  loadScript("https://nearspace.info/js/near-api-js.min.js", after);
  inizialise_game();
};

function inizialise_game(gameBoard, current_player, inverse_colors){
  if(current_player === undefined){
    current_player = 1;
  }

  if(inverse_colors === undefined)
    inverse_cinverse_colorsolors = false;

  console.log("current_player: " + current_player);
  console.log("inverse_colors: " + inverse_colors);

  if (gameBoard === undefined) {
    gameBoard = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];
  }

  //arrays to store the instances
  var pieces = [];
  var tiles = [];
  var tiles_near = [];
  let move_buffer = "";

  //distance formula
  var dist = function (x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
  }
  //Piece object - there are 24 instances of them in a checkers game
  function Piece(element, position, playerNumber, inverse_colors) {
    // when jump exist, regular move is not allowed
    // since there is no jump at round 1, all pieces are allowed to move initially
    this.allowedtomove = true;
    //linked DOM element
    this.element = element;
    //positions on gameBoard array in format row, column
    this.position = position;
    //which player's piece i it
    this.player = '';
    //figure out player by piece id
    /*if (this.element.attr("id") < 12)
      this.player = 1;
    else
      this.player = 2;*/
    this.player = playerNumber;
    //makes object a king
    this.king = false;
    this.makeKing = function () {
      if(inverse_colors) {
        this.element.css("backgroundImage", "url('img/king" + (this.player === 1 ? "2" : "1") + ".png')");
      }
      else{
        this.element.css("backgroundImage", "url('img/king" + this.player + ".png')");
      }
      this.king = true;
    }
    //moves the piece
    this.move = function (tile, e) {
      this.element.removeClass('selected');
      if (!Board.isValidPlacetoMove(tile.position[0], tile.position[1])) return false;

      /// player_2
      //make sure piece doesn't go backwards if it's not a king
      if (this.player == 1 && this.king == false) {
        // if (tile.position[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        // if (tile.position[0] > this.position[0]) return false;
      }

      let current_move = c1(this.position[1], current_player) + c2(this.position[0], current_player) + " "
          + c1(tile.position[1], current_player) + c2(tile.position[0], current_player);

      let double_move = document.getElementById('near-game-double-move').checked || (e !== undefined && e.shiftKey);
      console.log("double_move: " + double_move);
      if (double_move) {
        if (move_buffer) {
          move_buffer = move_buffer + " " + c1(tile.position[1], current_player) + c2(tile.position[0], current_player)
        }
        else {
          move_buffer = current_move;
        }
        document.getElementById("near-game-double-move").checked = false;
        console.log("move_buffer: " + move_buffer)
      }
      else{
        if (move_buffer) {
          make_move(move_buffer + " " + c1(tile.position[1], current_player) + c2(tile.position[0], current_player));
        }
        else {
          make_move(current_move);
        }
        move_buffer = "";
      }


      //remove the mark from Board.board and put it in the new spot
      Board.board[this.position[0]][this.position[1]] = 0;
      Board.board[tile.position[0]][tile.position[1]] = this.player;
      this.position = [tile.position[0], tile.position[1]];
      //change the css using board's dictionary
      this.element.css('top', Board.dictionary[this.position[0]]);
      this.element.css('left', Board.dictionary[this.position[1]]);
      //if piece reaches the end of the row on opposite side crown it a king (can move all directions)
      if (!this.king && (this.position[0] == 0 || this.position[0] == 7))
        this.makeKing();
      return true;
    };

    //tests if piece can jump anywhere
    this.canJumpAny = function () {
      return (this.canOpponentJump([this.position[0] + 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] + 2, this.position[1] - 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] + 2]) ||
        this.canOpponentJump([this.position[0] - 2, this.position[1] - 2]))
    };

    //tests if an opponent jump can be made to a specific place
    this.canOpponentJump = function (newPosition) {
      //find what the displacement is
      var dx = newPosition[1] - this.position[1];
      var dy = newPosition[0] - this.position[0];
      //make sure object doesn't go backwards if not a king
      if (this.player == 1 && this.king == false) {
        if (newPosition[0] < this.position[0]) return false;
      } else if (this.player == 2 && this.king == false) {
        if (newPosition[0] > this.position[0]) return false;
      }
      //must be in bounds
      if (newPosition[0] > 7 || newPosition[1] > 7 || newPosition[0] < 0 || newPosition[1] < 0) return false;
      //middle tile where the piece to be conquered sits
      var tileToCheckx = this.position[1] + dx / 2;
      var tileToChecky = this.position[0] + dy / 2;
      if (tileToCheckx > 7 || tileToChecky > 7 || tileToCheckx < 0 || tileToChecky < 0) return false;
      //if there is a piece there and there is no piece in the space after that
      if (!Board.isValidPlacetoMove(tileToChecky, tileToCheckx) && Board.isValidPlacetoMove(newPosition[0], newPosition[1])) {
        //find which object instance is sitting there
        for (let pieceIndex in pieces) {
          if (pieces[pieceIndex].position[0] == tileToChecky && pieces[pieceIndex].position[1] == tileToCheckx) {
            if (this.player != pieces[pieceIndex].player) {
              //return the piece sitting there
              return pieces[pieceIndex];
            }
          }
        }
      }
      return false;
    };

    this.opponentJump = function (tile) {
      // player_2
      return true;

      var pieceToRemove = this.canOpponentJump(tile.position);
      //if there is a piece to be removed, remove it
      if (pieceToRemove) {
        pieceToRemove.remove();
        return true;
      }
      return false;
    };

    this.remove = function () {
      //remove it and delete it from the gameboard
      this.element.css("display", "none");
      if (this.player == 1) {
        $('#player2').append("<div class='capturedPiece'></div>");
        Board.score.player2 += 1;
      }
      if (this.player == 2) {
        $('#player1').append("<div class='capturedPiece'></div>");
        Board.score.player1 += 1;
      }
      Board.board[this.position[0]][this.position[1]] = 0;
      //reset position so it doesn't get picked up by the for loop in the canOpponentJump method
      this.position = [];
      var playerWon = Board.checkifAnybodyWon();
      if (playerWon) {
        $('#winner').html("Player " + playerWon + " has won!");
      }
    }
  }

  function Tile(element, position) {
    //linked DOM element
    this.element = element;
    //position in gameboard
    this.position = position;
    //if tile is in range from the piece
    this.inRange = function (piece) {
      for (let k of pieces) {
        if (k.position[0] == this.position[0] && k.position[1] == this.position[1]) return 'wrong';
      }

      /// player_2
      // if (!piece.king && piece.player == 1 && this.position[0] < piece.position[0]) return 'wrong';
      // if (!piece.king && piece.player == 2 && this.position[0] > piece.position[0]) return 'wrong';

      if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == Math.sqrt(2)) {
        //regular move
        return 'regular';
      } else if (dist(this.position[0], this.position[1], piece.position[0], piece.position[1]) == 2 * Math.sqrt(2)) {
        //jump move
        return 'jump';
      }
    };
  }

  //Board object - controls logistics of game
  var Board = {
    board: gameBoard,
    score: {
      player1: 0,
      player2: 0
    },
    // player_2
    //playerTurn: 1,
    playerTurn: 1,
    jumpexist: false,
    continuousjump: false,
    tilesElement: $('div.tiles'),
    //dictionary to convert position in Board.board to the viewport units
    dictionary: ["0vmin", "10vmin", "20vmin", "30vmin", "40vmin", "50vmin", "60vmin", "70vmin", "80vmin", "90vmin"],
    //initialize the 8x8 board
    initalize: function () {
      var countPieces = 0;
      var countTiles = 0;
      for (let row in this.board) { //row is the index
        for (let column in this.board[row]) { //column is the index
          //whole set of if statements control where the tiles and pieces should be placed on the board
          if (row % 2 == 1) {
            if (column % 2 == 0) {
              countTiles = this.tileRender(row, column, countTiles)
            }
          } else {
            if (column % 2 == 1) {
              countTiles = this.tileRender(row, column, countTiles)
            }
          }
          if (Math.abs(this.board[row][column]) == 1) {
            countPieces = this.playerPiecesRender(this.board[row][column], row, column, countPieces, inverse_colors)
          } else if (Math.abs(this.board[row][column]) == 2) {
            countPieces = this.playerPiecesRender(this.board[row][column], row, column, countPieces, inverse_colors)
          }
        }
      }
      //tiles_near = tiles_near.reverse();
    },
    tileRender: function (row, column, countTiles) {
      this.tilesElement.append("<div class='tile' id='tile" + countTiles + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
      tiles[countTiles] = new Tile($("#tile" + countTiles), [parseInt(row), parseInt(column)]);
      return countTiles + 1
    },

    playerPiecesRender: function (playerNumber, row, column, countPieces, inverse_colors) {
      let makeKing = false;
      if(playerNumber === -1) {
        makeKing = true;
        playerNumber = 1;
      }
      if(playerNumber === -2) {
        makeKing = true;
        playerNumber = 2;
      }

      //player_2
      if (inverse_colors){
        $(`.player${playerNumber}pieces`).addClass("inverted");
      }

      let player_index = !inverse_colors ? playerNumber : [2, 1][playerNumber - 1];

      $(`.player${playerNumber}pieces`).append("<div class='piece " + players_css[player_index - 1] + "' id='" + countPieces + "' style='top:" + this.dictionary[row] + ";left:" + this.dictionary[column] + ";'></div>");
      pieces[countPieces] = new Piece($("#" + countPieces), [parseInt(row), parseInt(column)], playerNumber, inverse_colors);
      tiles_near[countPieces] = [['a','b','c','d','e','f','g','h'][parseInt(column)], 8 - parseInt(row)];
      if(makeKing){
        pieces[countPieces].makeKing();
      }

      return countPieces + 1;
    },
    //check if the location has an object
    isValidPlacetoMove: function (row, column) {
      //console.log(row); console.log(column); console.log(this.board);
      if (row < 0 || row > 7 || column < 0 || column > 7) return false;
      if (this.board[row][column] == 0) {
        return true;
      }
      return false;
    },
    //change the active player - also changes div.turn's CSS
    changePlayerTurn: function () {
      // player_2
      /* if (this.playerTurn == 1) {
        this.playerTurn = 2;
        $('.turn').css("background", "linear-gradient(to right, transparent 50%, #BEEE62 50%)");
      } else {
        this.playerTurn = 1;
        $('.turn').css("background", "linear-gradient(to right, #BEEE62 50%, transparent 50%)");
      }*/
      this.check_if_jump_exist()
      return;
    },
    checkifAnybodyWon: function () {
      if (this.score.player1 == 12) {
        return 1;
      } else if (this.score.player2 == 12) {
        return 2;
      }
      return false;
    },
    //reset the game
    clear: function () {
      location.reload();
    },
    check_if_jump_exist: function () {
      this.jumpexist = false
      this.continuousjump = false;
      for (let k of pieces) {
        k.allowedtomove = false;
        // if jump exist, only set those "jump" pieces "allowed to move"
        if (k.position.length != 0 && k.player == this.playerTurn && k.canJumpAny()) {
          this.jumpexist = true
          k.allowedtomove = true;
        }
      }
      // if jump doesn't exist, all pieces are allowed to move
      if (!this.jumpexist) {
        for (let k of pieces) k.allowedtomove = true;
      }
    },
    // Possibly helpful for communication with back-end.
    str_board: function () {
      ret = ""
      for (let i in this.board) {
        for (let j in this.board[i]) {
          var found = false
          for (let k of pieces) {
            if (k.position[0] == i && k.position[1] == j) {
              if (k.king) ret += (this.board[i][j] + 2)
              else ret += this.board[i][j]
              found = true
              break
            }
          }
          if (!found) ret += '0'
        }
      }
      return ret
    }
  }

  //initialize the board
  Board.initalize();

  /***
  Events
  ***/

  //select the piece on click if it is the player's turn
  $('.piece').on("click", function () {
    if($(this).hasClass('disabled')){
      return;
    }

    var selected;
    var isPlayersTurn = ($(this).parent().attr("class").split(' ')[0] == "player" + Board.playerTurn + "pieces");
    if (isPlayersTurn) {
      if (!Board.continuousjump && pieces[$(this).attr("id")].allowedtomove) {
        if ($(this).hasClass('selected')) selected = true;
        $('.piece').each(function (index) {
          $('.piece').eq(index).removeClass('selected')
        });
        if (!selected) {
          $(this).addClass('selected');
        }
      } else {
        let exist = "jump exist for other pieces, that piece is not allowed to move"
        let continuous = "continuous jump exist, you have to jump the same piece"
        let message = !Board.continuousjump ? exist : continuous
      }
    }
  });

  //reset game when clear button is pressed
  $('#cleargame').on("click", async function () {
    current_game_id = -1;
    load();
    //Board.clear();
    //await loadAvailableGames().then(async (my_games) => update_game_ui(my_games));
  });

  //move piece when tile is clicked
  $('.tile').on("click", function (e) {
    //make sure a piece is selected
    if ($('.selected').length != 0) {
      //find the tile object being clicked
      var tileID = $(this).attr("id").replace(/tile/, '');
      var tile = tiles[tileID];
      var tile_near = tiles_near[tileID];

      //find the piece being selected
      var piece = pieces[$('.selected').attr("id")];

      //check if the tile is in range from the object
      var inRange = tile.inRange(piece);
      if (inRange != 'wrong') {
        //if the move needed is jump, then move it but also check if another move can be made (double and triple jumps)
        if (inRange == 'jump') {
          if (piece.opponentJump(tile)) {
            piece.move(tile, e);
            if (piece.canJumpAny()) {
              // Board.changePlayerTurn(); //change back to original since another turn can be made
              piece.element.addClass('selected');
              // exist continuous jump, you are not allowed to de-select this piece or select other pieces
              Board.continuousjump = true;
            } else {
              Board.changePlayerTurn()
            }
          }
          //if it's regular then move it if no jumping is available
        } else if (inRange == 'regular' && !Board.jumpexist) {
          //player_2
          //if (!piece.canJumpAny()) {
            piece.move(tile, e);
            Board.changePlayerTurn()
          /*} else {
            alert("You must jump when possible!");
       щ   }*/
        }
      }
    }
  });

  const GAS_MAKE_AVAILABLE = 500000000000000;
  $('#near-make-available').on("click", async function () {
    let bidNEAR = parseFloat(document.getElementById("near-bid-deposit").value);
    let bidCheddar = parseFloat(document.getElementById("cheddar-bid-deposit").value);
    if (bidNEAR >= 0.01) {
      let referrer_id = get_referral();
      await window.contract.make_available({config: {first_move: "Random"}, referrer_id}, GAS_MAKE_AVAILABLE, window.nearApi.utils.format.parseNearAmount(bidNEAR.toString())).then(resp => {
        console.log(resp);
        load();
      });
    } if (bidCheddar >= 1) {

      await ft_transfer(window.accountId, bidCheddar, "token-v3.cheddar.testnet").then(resp => {
        console.log(resp);
        load();
      });

      // await window.contract.make_available_ft({sender_id: window.accountId, amount: 1, token_id: "token-v2.cheddar.testnet"}, GAS_MAKE_AVAILABLE).then(resp => {
      //   console.log(resp);
      //   load();
      // });
    } else {
      alert("Bid should be > 0.01 NEAR or > 1 Cheddar")
    }
  });
  $('#near-make-unavailable').on("click", async function () {
      await window.contract.make_unavailable().then(resp => {
        console.log(resp);
        load();
      });
  });

  updateAllPlayersNft();
}

function c1(i, current_player){
  if(current_player === 2)
    return ['a','b','c','d','e','f','g','h'][parseInt(i)]
  else if(current_player === 1)
    return ['a','b','c','d','e','f','g','h'][7-parseInt(i)]
}

function c2(i, current_player){
  if(current_player === 2)
    return (8 - parseInt(i)).toString();
  else if(current_player === 1)
    return (1 + parseInt(i)).toString();
}


