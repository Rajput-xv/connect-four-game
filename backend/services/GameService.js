const Game = require('../models/Game');
const Player = require('../models/Player');
const GameLogic = require('../utils/gameLogic');
const { PLAYER_ONE, PLAYER_TWO } = require('../utils/constants');

class GameService {
  constructor() {
    this.activeGames = new Map();
    this.playerGameMap = new Map();
    this.disconnectedPlayers = new Map();
    this.rematchGames = new Map();
  }

  setRematchGame(oldGameId, newGameId) {
    this.rematchGames.set(oldGameId, newGameId);
  }

  getRematchGame(oldGameId) {
    return this.rematchGames.get(oldGameId);
  }

  async createGame(gameId, player1, player2) {
    const gameData = {
      gameId,
      player1: {
        socketId: player1.socketId,
        username: player1.username,
        color: player1.color
      },
      player2: {
        socketId: player2.socketId,
        username: player2.username,
        color: player2.color,
        isBot: player2.isBot || false,
        // botDifficulty: player2.botDifficulty || 'hard'
      },
      board: GameLogic.createEmptyBoard(),
      currentTurn: PLAYER_ONE,
      status: 'active',
      startedAt: new Date(),
      moveHistory: [],
      spectators: [] 
    };

    // Save to database
    const game = new Game(gameData);
    await game.save();

    // Store in memory
    this.activeGames.set(gameId, gameData);
    this.playerGameMap.set(player1.socketId, gameId);
    if (!player2.isBot) {
      this.playerGameMap.set(player2.socketId, gameId);
    }

    return gameData;
  }

  addSpectator(gameId, socketId, username) {
    const game = this.activeGames.get(gameId);
    if (game && game.status === 'active') {
      game.spectators = game.spectators || [];
      game.spectators.push({ socketId, username });
      return game;
    }
    return null;
  }

  removeSpectator(gameId, socketId) {
    const game = this.activeGames.get(gameId);
    if (game && game.spectators) {
      game.spectators = game.spectators.filter(s => s.socketId !== socketId);
    }
  }

  getAllActiveGames() {
    const games = [];
    this.activeGames.forEach((game, gameId) => {
      if (game.status === 'active') {
        games.push({
          gameId,
          player1: game.player1.username,
          player2: game.player2.username,
          currentTurn: game.currentTurn,
          moveCount: game.moveHistory.length,
          spectatorCount: (game.spectators || []).length
        });
      }
    });
    return games;
  }

  async makeMove(gameId, column, player) {
    const game = this.activeGames.get(gameId);
    if (!game) return { success: false, error: 'Game not found' };

    // Prevent any further moves or DB updates if game is already completed or forfeited
    if (game.status !== 'active') {
      return { success: false, error: 'Game is already over' };
    }

    if (game.currentTurn !== player) {
      return { success: false, error: 'Not your turn' };
    }

    if (!GameLogic.isValidMove(game.board, column)) {
      return { success: false, error: 'Invalid move' };
    }

    const result = GameLogic.makeMove(game.board, column, player);
    if (!result.success) {
      return { success: false, error: 'Move failed' };
    }

    game.board = result.board;
    game.moveHistory.push({
      player,
      column,
      timestamp: new Date()
    });

    // Check for winner
    const hasWon = GameLogic.checkWinner(result.board, result.row, column, player);
    const isFull = GameLogic.isBoardFull(result.board);

    if (hasWon) {
      game.status = 'completed';
      game.winner = player === PLAYER_ONE ? game.player1.username : game.player2.username;
      game.completedAt = new Date();
      await this.updatePlayerStats(game.winner, 'win');
      
      const loser = player === PLAYER_ONE ? game.player2.username : game.player1.username;
      await this.updatePlayerStats(loser, 'loss');
    } else if (isFull) {
      game.status = 'completed';
      game.winner = 'draw';
      game.completedAt = new Date();
      await this.updatePlayerStats(game.player1.username, 'draw');
      await this.updatePlayerStats(game.player2.username, 'draw');
    } else {
      // Switch turn
      game.currentTurn = game.currentTurn === PLAYER_ONE ? PLAYER_TWO : PLAYER_ONE;
    }

    // Update database
    await Game.findOneAndUpdate(
      { gameId },
      game,
      { new: true }
    );

    return {
      success: true,
      board: game.board,
      currentTurn: game.currentTurn,
      status: game.status,
      winner: game.winner,
      lastMove: { row: result.row, column }
    };
  }

  async updatePlayerStats(username, result) {
    let player = await Player.findOne({ username });
    
    if (!player) {
      player = new Player({ username });
    }

    player.totalGames += 1;
    
    if (result === 'win') {
      player.gamesWon += 1;
    } else if (result === 'loss') {
      player.gamesLost += 1;
    } else if (result === 'draw') {
      player.gamesDrawn += 1;
    }

    await player.save();
  }

  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  getGameBySocketId(socketId) {
    const gameId = this.playerGameMap.get(socketId);
    return gameId ? this.activeGames.get(gameId) : null;
  }

  async forfeitGame(gameId, socketId) {
    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return;

    game.status = 'forfeited';
    game.completedAt = new Date();

    // Determine winner (the player who didn't disconnect)
    const forfeitedPlayer = this.playerGameMap.get(socketId);
    game.winner = game.player1.socketId === socketId ? 
      game.player2.username : game.player1.username;

    await Game.findOneAndUpdate({ gameId }, game);
    
    await this.updatePlayerStats(game.winner, 'win');
    const loser = game.winner === game.player1.username ? 
      game.player2.username : game.player1.username;
    await this.updatePlayerStats(loser, 'loss');

    this.activeGames.delete(gameId);
  }

  handleDisconnect(socketId) {
    const gameId = this.playerGameMap.get(socketId);
    if (!gameId) return null;

    const game = this.activeGames.get(gameId);
    if (!game || game.status !== 'active') return null;

    // Store both socketId and username for reconnection
    const username = (game.player1.socketId === socketId)
      ? game.player1.username
      : game.player2.username;

    this.disconnectedPlayers.set(socketId, {
      gameId,
      username,
      timestamp: Date.now()
    });

    return { gameId, game };
  }

  // Allow reconnection by username within 30s
  handleReconnect(socketId, gameId, username) {
    // Find the disconnected player by username
    let foundKey = null;
    for (const [sid, info] of this.disconnectedPlayers.entries()) {
      if (info.gameId === gameId && info.username === username) {
        foundKey = sid;
        break;
      }
    }
    if (foundKey) {
      this.disconnectedPlayers.delete(foundKey);
      // Update player socketId in game
      const game = this.activeGames.get(gameId);
      if (game) {
        if (game.player1.username === username) {
          this.playerGameMap.delete(game.player1.socketId);
          game.player1.socketId = socketId;
          this.playerGameMap.set(socketId, gameId);
        } else if (game.player2.username === username) {
          this.playerGameMap.delete(game.player2.socketId);
          game.player2.socketId = socketId;
          this.playerGameMap.set(socketId, gameId);
        }
        return game;
      }
    }
    return null;
  }
}

module.exports = new GameService();