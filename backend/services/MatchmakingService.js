const { v4: uuidv4 } = require('uuid');
const { MATCHMAKING_TIMEOUT } = require('../utils/constants');

class MatchmakingService {
  constructor() {
    this.waitingPlayers = new Map();
    this.playerTimers = new Map();
  }

  addPlayer(socketId, username) {
    this.waitingPlayers.set(socketId, {
      socketId,
      username,
      timestamp: Date.now()
    });

    return this.findMatch(socketId);
  }

  findMatch(currentSocketId) {
    const waitingPlayersList = Array.from(this.waitingPlayers.values());
    
    // Find another waiting player (not the current one)
    const opponent = waitingPlayersList.find(
      player => player.socketId !== currentSocketId
    );

    if (opponent && waitingPlayersList.length >= 2) {
      // Match found
      const currentPlayer = this.waitingPlayers.get(currentSocketId);
      
      this.waitingPlayers.delete(currentSocketId);
      this.waitingPlayers.delete(opponent.socketId);
      
      this.clearTimer(currentSocketId);
      this.clearTimer(opponent.socketId);

      const gameId = uuidv4();
      
      return {
        matched: true,
        gameId,
        player1: {
          socketId: currentPlayer.socketId,
          username: currentPlayer.username,
          color: 'red'
        },
        player2: {
          socketId: opponent.socketId,
          username: opponent.username,
          color: 'yellow'
        }
      };
    }

    return { matched: false };
  }

  setTimer(socketId, callback) {
    const timer = setTimeout(() => {
      callback();
      this.waitingPlayers.delete(socketId);
      this.playerTimers.delete(socketId);
    }, MATCHMAKING_TIMEOUT);

    this.playerTimers.set(socketId, timer);
  }

  clearTimer(socketId) {
    const timer = this.playerTimers.get(socketId);
    if (timer) {
      clearTimeout(timer);
      this.playerTimers.delete(socketId);
    }
  }

  removePlayer(socketId) {
    this.clearTimer(socketId);
    this.waitingPlayers.delete(socketId);
  }
}

module.exports = new MatchmakingService();