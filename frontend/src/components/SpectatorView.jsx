import { Box, Paper, Typography, Button, Chip, Grid, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GameBoard from './GameBoard';
import SpectatorChat from './SpectatorChat';
import Leaderboard from './Leaderboard';

export default function SpectatorView({
  gameState,
  player1,
  player2,
  player1Color,
  player2Color,
  spectatorCount,
  onBack,
  username,
  gameId,
  chatMessages,
  onSendChatMessage
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const getCurrentPlayer = () => {
    return gameState.currentTurn === 1 ? player1 : player2;
  };

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 1200, margin: '0 auto', px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5">
              👁️ Spectating
            </Typography>
            <Chip
              icon={<VisibilityIcon />}
              label={`${spectatorCount} watching`}
              color="primary"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6">{player1}</Typography>
              <Chip
                label={player1Color}
                size="small"
                sx={{
                  bgcolor: player1Color === 'red' ? '#f44336' : '#fdd835',
                  color: player1Color === 'red' ? 'white' : 'black'
                }}
              />
            </Box>
            <Typography variant="h6" color="text.secondary">VS</Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6">{player2}</Typography>
              <Chip
                label={player2Color}
                size="small"
                sx={{
                  bgcolor: player2Color === 'red' ? '#f44336' : '#fdd835',
                  color: player2Color === 'red' ? 'white' : 'black'
                }}
              />
            </Box>
          </Box>

          {gameState.status === 'active' ? (
            <Typography variant="h6" align="center" color="primary" sx={{ fontWeight: 'bold' }}>
              {getCurrentPlayer()}'s turn
            </Typography>
          ) : (
            <Typography variant="h5" align="center" color="success.main" sx={{ fontWeight: 'bold' }}>
              {gameState.winner === 'draw' ? "It's a draw!" : `${gameState.winner} wins! 🎉`}
            </Typography>
          )}
        </Paper>

        {isMobile ? (
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GameBoard
                board={gameState.board}
                onColumnClick={() => {}}
                disabled={true}
                lastMove={gameState.lastMove}
              />
            </Box>
            <SpectatorChat
              gameId={gameId}
              username={username}
              messages={chatMessages}
              onSendMessage={onSendChatMessage}
            />
            <Leaderboard />
          </Stack>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <GameBoard
                  board={gameState.board}
                  onColumnClick={() => {}}
                  disabled={true}
                  lastMove={gameState.lastMove}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={5}>
              <SpectatorChat
                gameId={gameId}
                username={username}
                messages={chatMessages}
                onSendMessage={onSendChatMessage}
              />
              <Box sx={{ mt: 3 }}>
                <Leaderboard />
              </Box>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
}