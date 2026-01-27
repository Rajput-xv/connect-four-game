import { Paper, Typography, Box, Chip } from '@mui/material';

export default function GameStatus({ 
  gameState, 
  username, 
  opponent, 
  playerNumber,
  yourColor,
  opponentColor 
}) {
  const isYourTurn = gameState.currentTurn === playerNumber;

  const getStatusMessage = () => {
    if (gameState.status === 'waiting') {
      return 'Waiting for opponent...';
    }
    if (gameState.status === 'completed') {
      if (gameState.winner === 'draw') {
        return "It's a draw!";
      }
      if (gameState.winner === username) {
        return 'You won! 🎉';
      }
      return 'You lost!';
    }
    return isYourTurn ? 'Your turn' : `${opponent}'s turn`;
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h6">{username}</Typography>
          <Chip 
            label={yourColor} 
            size="small" 
            sx={{ 
              bgcolor: yourColor === 'red' ? '#f44336' : '#fdd835',
              color: yourColor === 'red' ? 'white' : 'black'
            }} 
          />
        </Box>
        <Typography variant="h6" color="text.secondary">VS</Typography>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="h6">{opponent}</Typography>
          <Chip 
            label={opponentColor} 
            size="small" 
            sx={{ 
              bgcolor: opponentColor === 'red' ? '#f44336' : '#fdd835',
              color: opponentColor === 'red' ? 'white' : 'black'
            }} 
          />
        </Box>
      </Box>
      <Typography 
        variant="h5" 
        align="center" 
        color={isYourTurn ? 'primary' : 'text.secondary'}
        sx={{ fontWeight: 'bold' }}
      >
        {getStatusMessage()}
      </Typography>
    </Paper>
  );
}