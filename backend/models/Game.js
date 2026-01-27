const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  gameId: {
    type: String,
    required: true,
    unique: true
  },
  player1: {
    username: String,
    color: String
  },
  player2: {
    username: String,
    color: String,
    isBot: {
      type: Boolean,
      default: false
    }
  },
  board: {
    type: [[Number]],
    default: () => Array(6).fill(null).map(() => Array(7).fill(0))
  },
  currentTurn: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'forfeited'],
    default: 'waiting'
  },
  winner: {
    type: String,
    default: null
  },
  moveHistory: [{
    player: Number,
    column: Number,
    timestamp: Date
  }],
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema);