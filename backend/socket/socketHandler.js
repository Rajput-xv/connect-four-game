const GameService = require('../services/GameService');
const BotService = require('../services/BotService');
const MatchmakingService = require('../services/MatchmakingService');
const { PLAYER_TWO, RECONNECT_TIMEOUT } = require('../utils/constants');
const { v4: uuidv4 } = require('uuid');

function setupSocketHandlers(io) {
  // Instantly start a new game with the bot (no matchmaking wait)
  socket.on('start-bot-game', async ({ username }) => {
    const gameId = uuidv4();
    const game = await GameService.createGame(
      gameId,
      { socketId: socket.id, username, color: 'red' },
      { socketId: 'bot', username: 'Bot', color: 'yellow', isBot: true }
    );

    socket.emit('match-found', {
      gameId: game.gameId,
      opponent: 'Bot',
      playerNumber: 1,
      yourColor: game.player1.color,
      opponentColor: game.player2.color,
      isBot: true
    });
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('find-match', async ({ username }) => {
      console.log(`${username} looking for match`);

      const matchResult = MatchmakingService.addPlayer(socket.id, username);

      if (matchResult.matched) {
        // Match found with another player
        const game = await GameService.createGame(
          matchResult.gameId,
          { ...matchResult.player1, socketId: matchResult.player1.socketId },
          { ...matchResult.player2, socketId: matchResult.player2.socketId }
        );

        io.to(matchResult.player1.socketId).emit('match-found', {
          gameId: game.gameId,
          opponent: game.player2.username,
          playerNumber: 1,
          yourColor: game.player1.color,
          opponentColor: game.player2.color
        });

        io.to(matchResult.player2.socketId).emit('match-found', {
          gameId: game.gameId,
          opponent: game.player1.username,
          playerNumber: 2,
          yourColor: game.player2.color,
          opponentColor: game.player1.color
        });
      } else {
        // No match found, start timer for bot
        socket.emit('waiting-for-opponent');

        MatchmakingService.setTimer(socket.id, async () => {
          // Timeout - start game with bot
          const gameId = uuidv4();
          const game = await GameService.createGame(
            gameId,
            { socketId: socket.id, username, color: 'red' },
            { socketId: 'bot', username: 'Bot', color: 'yellow', isBot: true }
          );

          socket.emit('match-found', {
            gameId: game.gameId,
            opponent: 'Bot',
            playerNumber: 1,
            yourColor: game.player1.color,
            opponentColor: game.player2.color,
            isBot: true
          });
        });
      }
    });

    socket.on('make-move', async ({ gameId, column }) => {
      const game = GameService.getGame(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const playerNumber = game.player1.socketId === socket.id ? 1 : 2;
      
      const result = await GameService.makeMove(gameId, column, playerNumber);

      if (!result.success) {
        socket.emit('error', { message: result.error });
        return;
      }

      // Emit move to all players in the game
      io.to(game.player1.socketId).emit('move-made', {
        board: result.board,
        currentTurn: result.currentTurn,
        lastMove: result.lastMove,
        player: playerNumber
      });

      if (!game.player2.isBot) {
        io.to(game.player2.socketId).emit('move-made', {
          board: result.board,
          currentTurn: result.currentTurn,
          lastMove: result.lastMove,
          player: playerNumber
        });
      }

      io.to(`game-${gameId}`).emit('spectate-move-made', {
        board: result.board,
        currentTurn: result.currentTurn,
        lastMove: result.lastMove,
        player: playerNumber
      });

      if (result.status === 'completed') {
        const gameOverData = {
          winner: result.winner,
          board: result.board
        };

        io.to(game.player1.socketId).emit('game-over', gameOverData);
        if (!game.player2.isBot) {
          io.to(game.player2.socketId).emit('game-over', gameOverData);
        }

        // ← ADD THIS: Notify spectators game ended
        io.to(`game-${gameId}`).emit('spectate-game-over', gameOverData);
      }

      if (result.status === 'completed') {
        const gameOverData = {
          winner: result.winner,
          board: result.board
        };

        io.to(game.player1.socketId).emit('game-over', gameOverData);
        if (!game.player2.isBot) {
          io.to(game.player2.socketId).emit('game-over', gameOverData);
        }
      } else if (game.player2.isBot && result.currentTurn === PLAYER_TWO) {
        // Bot's turn
        setTimeout(async () => {
          const botColumn = BotService.getBotMove(result.board);
          const botResult = await GameService.makeMove(gameId, botColumn, PLAYER_TWO);

          if (botResult.success) {
            io.to(game.player1.socketId).emit('move-made', {
              board: botResult.board,
              currentTurn: botResult.currentTurn,
              lastMove: botResult.lastMove,
              player: PLAYER_TWO
            });

            if (botResult.status === 'completed') {
              io.to(game.player1.socketId).emit('game-over', {
                winner: botResult.winner,
                board: botResult.board
              });
            }
          }
        }, 500);
      }
    });

    socket.on('reconnect-game', async ({ gameId, username }) => {
      const game = GameService.handleReconnect(socket.id, gameId, username);
      if (game) {
        socket.emit('game-reconnected', {
          board: game.board,
          currentTurn: game.currentTurn,
          player1: game.player1.username,
          player2: game.player2.username
        });
      } else {
        socket.emit('error', { message: 'Could not reconnect to game' });
      }
    });

    socket.on('request-rematch', async ({ gameId }) => {
      const game = GameService.getGame(gameId);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      // Don't allow rematch with bot
      if (game.player2.isBot) {
        socket.emit('error', { message: 'Cannot rematch with bot' });
        return;
      }

      const requestingPlayer = game.player1.socketId === socket.id ? 1 : 2;
      const opponentSocketId = requestingPlayer === 1 ? 
        game.player2.socketId : game.player1.socketId;

      // Send rematch request to opponent
      io.to(opponentSocketId).emit('rematch-requested', {
        gameId,
        from: requestingPlayer === 1 ? game.player1.username : game.player2.username
      });

      // Notify requester
      socket.emit('rematch-request-sent');

      // Set 30 second timeout
      setTimeout(() => {
        // Check if rematch was accepted
        const newGame = GameService.getRematchGame(gameId);
        if (!newGame) {
          socket.emit('rematch-timeout');
          io.to(opponentSocketId).emit('rematch-timeout');
        }
      }, 30000);
    });

    socket.on('accept-rematch', async ({ gameId }) => {
      const oldGame = GameService.getGame(gameId);
      
      if (!oldGame) {
        socket.emit('error', { message: 'Original game not found' });
        return;
      }

      const acceptingPlayer = oldGame.player1.socketId === socket.id ? 1 : 2;
      const opponentSocketId = acceptingPlayer === 1 ? 
        oldGame.player2.socketId : oldGame.player1.socketId;

      // Create new game with same players (swap colors)
      const newGameId = uuidv4();
      const newGame = await GameService.createGame(
        newGameId,
        {
          socketId: oldGame.player1.socketId,
          username: oldGame.player1.username,
          color: oldGame.player2.color // Swap colors
        },
        {
          socketId: oldGame.player2.socketId,
          username: oldGame.player2.username,
          color: oldGame.player1.color // Swap colors
        }
      );

      // Mark as rematch
      GameService.setRematchGame(gameId, newGameId);

      // Notify both players
      io.to(oldGame.player1.socketId).emit('rematch-accepted', {
        gameId: newGame.gameId,
        opponent: newGame.player2.username,
        playerNumber: 1,
        yourColor: newGame.player1.color,
        opponentColor: newGame.player2.color
      });

      io.to(oldGame.player2.socketId).emit('rematch-accepted', {
        gameId: newGame.gameId,
        opponent: newGame.player1.username,
        playerNumber: 2,
        yourColor: newGame.player2.color,
        opponentColor: newGame.player1.color
      });
    });

    socket.on('decline-rematch', async ({ gameId }) => {
      const game = GameService.getGame(gameId);
      
      if (!game) return;

      const decliningPlayer = game.player1.socketId === socket.id ? 1 : 2;
      const opponentSocketId = decliningPlayer === 1 ? 
        game.player2.socketId : game.player1.socketId;

      // Notify opponent
      io.to(opponentSocketId).emit('rematch-declined');
      socket.emit('rematch-declined');
    });

    socket.on('get-active-games', () => {
      const games = GameService.getAllActiveGames();
      socket.emit('active-games-list', { games });
    });

    socket.on('join-spectate', ({ gameId, username }) => {
      const game = GameService.addSpectator(gameId, socket.id, username);
      
      if (!game) {
        socket.emit('error', { message: 'Game not found or ended' });
        return;
      }

      // Join the game room
      socket.join(`game-${gameId}`);

      // Send current game state to spectator
      socket.emit('spectate-started', {
        gameId,
        board: game.board,
        currentTurn: game.currentTurn,
        player1: game.player1.username,
        player2: game.player2.username,
        player1Color: game.player1.color,
        player2Color: game.player2.color,
        moveHistory: game.moveHistory,
        spectatorCount: game.spectators.length
      });

      // Notify all spectators about new viewer
      io.to(`game-${gameId}`).emit('spectator-joined', {
        spectatorCount: game.spectators.length,
        username
      });
    });

    socket.on('leave-spectate', ({ gameId }) => {
      GameService.removeSpectator(gameId, socket.id);
      socket.leave(`game-${gameId}`);
      
      const game = GameService.getGame(gameId);
      if (game) {
        io.to(`game-${gameId}`).emit('spectator-left', {
          spectatorCount: (game.spectators || []).length
        });
      }
    });

    socket.on('spectator-chat-message', ({ gameId, username, message }) => {
      // Validate message
      if (!message || message.trim().length === 0) return;
      if (message.length > 200) return; // Limit message length

      const game = GameService.getGame(gameId);
      if (!game) return;

      // Check if user is actually spectating this game
      const isSpectator = game.spectators?.some(s => s.socketId === socket.id);
      if (!isSpectator) return;

      // Broadcast message to all spectators (but not players)
      const chatMessage = {
        username,
        message: message.trim(),
        timestamp: new Date().toISOString(),
        messageId: `${socket.id}-${Date.now()}`
      };

      // Send to all spectators in this game room
      io.to(`game-${gameId}`).emit('spectator-chat-received', chatMessage);
      
      console.log(`Chat in ${gameId} from ${username}: ${message}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      MatchmakingService.removePlayer(socket.id);
      const disconnectInfo = GameService.handleDisconnect(socket.id);
      if (disconnectInfo) {
        const { gameId, game } = disconnectInfo;
        setTimeout(async () => {
          // Check if player reconnected (by username)
          let stillDisconnected = false;
          let username = null;
          for (const [sid, info] of GameService.disconnectedPlayers.entries()) {
            if (info.gameId === gameId) {
              stillDisconnected = true;
              username = info.username;
              break;
            }
          }
          if (stillDisconnected) {
            // Player didn't reconnect - forfeit game
            // Find socketId by username
            let forfeitingSocketId = null;
            if (game.player1.username === username) forfeitingSocketId = game.player1.socketId;
            if (game.player2.username === username) forfeitingSocketId = game.player2.socketId;
            await GameService.forfeitGame(gameId, forfeitingSocketId);
            const opponent = (game.player1.username === username)
              ? game.player2.socketId
              : game.player1.socketId;
            if (opponent) {
              io.to(opponent).emit('opponent-disconnected', {
                message: 'Opponent disconnected. You win!'
              });
            }
          }
        }, RECONNECT_TIMEOUT);
      }
    });
  });
}

module.exports = setupSocketHandlers;