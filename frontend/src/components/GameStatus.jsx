import { Paper, Typography, Box, Chip } from '@mui/material';
import { blue } from '@mui/material/colors';
import { PLAYER_COLORS, PLAYER_LABELS } from '../utils/colors';

export default function GameStatus({ 
  gameState, 
  username, 
  opponent, 
  playerNumber,
  yourColor,
  opponentColor,
  spectateCount = 0
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
    <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          gap: { xs: 1, sm: 0 }
        }}
      >
        <Box>
          <Typography variant="h6">{username}</Typography>
          <Chip 
            label={yourColor}
            size="small"
            sx={{
              bgcolor: PLAYER_COLORS[yourColor === 'red' ? 1 : 2],
              color: yourColor === 'red' ? 'white' : 'black'
            }}
          />
        </Box>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' }, my: { xs: 1, sm: 0 } }}
        >
          VS
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6">{opponent}</Typography>
            <Chip 
              label={opponentColor}
              size="small"
              sx={{
                bgcolor: PLAYER_COLORS[opponentColor === 'red' ? 1 : 2],
                color: opponentColor === 'red' ? 'white' : 'black'
              }}
            />
          </Box>
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ bgcolor: blue[200], display: 'flex', alignItems: 'center', gap: 0.5, p: 1, borderRadius: 1 }}>
              <span role="img" aria-label="spectators">👁️</span> {spectateCount}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Typography
        variant="h5"
        align="center"
        color={isYourTurn ? 'primary' : 'text.secondary'}
        sx={{ fontWeight: 'bold', fontSize: { xs: '1.2rem', sm: '1.5rem' } }}
      >
        {getStatusMessage()}
      </Typography>
    </Paper>
  );
}