import { useState, useEffect, useRef } from 'react';
import { Container, Box, Button, Typography, Alert } from '@mui/material';
import UsernameInput from './components/UsernameInput';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import Leaderboard from './components/Leaderboard';
import socketService from './services/socketService';

function App() {
  const [gameStage, setGameStage] = useState('username'); // username, waiting, playing, finished
  const [username, setUsername] = useState('');
  const [gameState, setGameState] = useState({
    gameId: null,
    board: Array(6).fill(null).map(() => Array(7).fill(0)),
    currentTurn: 1,
    status: 'waiting',
    winner: null,
    lastMove: null
  });
  const [opponent, setOpponent] = useState('');
  const [playerNumber, setPlayerNumber] = useState(null);
  const [yourColor, setYourColor] = useState('');
  const [opponentColor, setOpponentColor] = useState('');
  const [error, setError] = useState('');
  const [isBot, setIsBot] = useState(false);
  
  // Use ref to track if socket handlers are set up
  const handlersSetup = useRef(false);

  useEffect(() => {
    // Connect to socket only once
    socketService.connect();

    // Setup event handlers only once
    if (!handlersSetup.current) {
      handlersSetup.current = true;

      socketService.on('waiting-for-opponent', () => {
        console.log('Waiting for opponent...');
        setGameStage('waiting');
        setError('');
      });

      socketService.on('match-found', (data) => {
        console.log('Match found:', data);
        setGameState(prev => ({
          ...prev,
          gameId: data.gameId,
          status: 'active',
          currentTurn: 1
        }));
        setOpponent(data.opponent);
        setPlayerNumber(data.playerNumber);
        setYourColor(data.yourColor);
        setOpponentColor(data.opponentColor);
        setIsBot(data.isBot || false);
        setGameStage('playing');
        setError('');
      });

      socketService.on('move-made', (data) => {
        console.log('Move made:', data);
        setGameState(prev => ({
          ...prev,
          board: data.board,
          currentTurn: data.currentTurn,
          lastMove: data.lastMove
        }));
      });

      socketService.on('game-over', (data) => {
        console.log('Game over:', data);
        setGameState(prev => ({
          ...prev,
          board: data.board,
          status: 'completed',
          winner: data.winner
        }));
        setGameStage('finished');
      });

      socketService.on('opponent-disconnected', (data) => {
        console.log('Opponent disconnected:', data);
        setError(data.message);
        setGameState(prev => ({
          ...prev,
          status: 'completed'
        }));
        setGameStage('finished');
      });

      socketService.on('error', (data) => {
        console.error('Game error:', data);
        setError(data.message);
      });
    }

    // Cleanup on unmount
    return () => {
      // Don't disconnect in development due to React StrictMode
      // Only clean up handlers
      if (import.meta.env.PROD) {
        socketService.disconnect();
      }
    };
  }, []);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
    setError('');
    socketService.emit('find-match', { username: name });
    setGameStage('waiting');
  };

  const handleColumnClick = (column) => {
    // Check if it's the player's turn
    if (gameState.currentTurn !== playerNumber) {
      setError("It's not your turn!");
      setTimeout(() => setError(''), 2000);
      return;
    }

    // Check if game is active
    if (gameState.status !== 'active') {
      setError('Game is not active');
      setTimeout(() => setError(''), 2000);
      return;
    }

    console.log('Making move:', { gameId: gameState.gameId, column });
    socketService.emit('make-move', {
      gameId: gameState.gameId,
      column
    });
  };

  const handlePlayAgain = () => {
    setGameStage('username');
    setGameState({
      gameId: null,
      board: Array(6).fill(null).map(() => Array(7).fill(0)),
      currentTurn: 1,
      status: 'waiting',
      winner: null,
      lastMove: null
    });
    setOpponent('');
    setPlayerNumber(null);
    setYourColor('');
    setOpponentColor('');
    setError('');
    setIsBot(false);
  };

  if (gameStage === 'username') {
    return (
      <Box>
        <UsernameInput onSubmit={handleUsernameSubmit} />
        <Container maxWidth="md">
          <Leaderboard />
        </Container>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>
        4 in a Row
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {gameStage === 'waiting' && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom>
            Finding an opponent...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            If no player joins in 10 seconds, you'll play against a bot
          </Typography>
        </Box>
      )}

      {(gameStage === 'playing' || gameStage === 'finished') && (
        <Box>
          <GameStatus
            gameState={gameState}
            username={username}
            opponent={opponent}
            playerNumber={playerNumber}
            yourColor={yourColor}
            opponentColor={opponentColor}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <GameBoard
              board={gameState.board}
              onColumnClick={handleColumnClick}
              disabled={gameState.currentTurn !== playerNumber || gameState.status !== 'active'}
              lastMove={gameState.lastMove}
            />
          </Box>

          {gameStage === 'finished' && (
            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handlePlayAgain}
              >
                Play Again
              </Button>
            </Box>
          )}

          <Leaderboard />
        </Box>
      )}
    </Container>
  );
}

export default App;