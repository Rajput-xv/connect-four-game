const express = require('express');
const Player = require('../models/Player');
const Game = require('../models/Game');

const router = express.Router();

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const players = await Player.find()
      .sort({ gamesWon: -1 })
      // .limit(10)
      .select('username gamesWon gamesLost gamesDrawn totalGames');
    
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get player stats
router.get('/player/:username', async (req, res) => {
  try {
    const player = await Player.findOne({ username: req.params.username });
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json(player);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get game history
router.get('/games/:username', async (req, res) => {
  try {
    const games = await Game.find({
      $or: [
        { 'player1.username': req.params.username },
        { 'player2.username': req.params.username }
      ],
      status: 'completed'
    })
    .sort({ completedAt: -1 })
    .limit(20);
    
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch game history' });
  }
});

module.exports = router;