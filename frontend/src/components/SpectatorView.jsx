import { Box, Paper, Typography, Button, Chip, Grid, Stack, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GameBoard from './GameBoard';
import SpectatorChat from './SpectatorChat';
import Leaderboard from './Leaderboard';
import React, { useEffect, useState } from 'react';

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
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    if (gameState.status === 'completed') {
      setShowGameOver(true);
      const timer = setTimeout(() => {
        setShowGameOver(false);
        onBack();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, onBack]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const getCurrentPlayer = () => {
    return gameState.currentTurn === 1 ? player1 : player2;
  };

  return (
    <Box sx={{ py: 4, position: 'relative' }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: player1Color === 'red' ? '#f44336' : '#fdd835',
                  border: '2px solid',
                  borderColor: player1Color === 'red' ? '#b71c1c' : '#fbc02d',
                  mr: 1
                }}
              />
              <Typography variant="h6">{player1}</Typography>
              <Chip
                label={player1Color}
                size="small"
                sx={{
                  bgcolor: player1Color === 'red' ? '#f44336' : '#fdd835',
                  color: player1Color === 'red' ? 'white' : 'black',
                  ml: 1
                }}
              />
            </Box>
            <Typography variant="h6" color="text.secondary">VS</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: player2Color === 'red' ? '#f44336' : '#fdd835',
                  border: '2px solid',
                  borderColor: player2Color === 'red' ? '#b71c1c' : '#fbc02d',
                  mr: 1
                }}
              />
              <Typography variant="h6">{player2}</Typography>
              <Chip
                label={player2Color}
                size="small"
                sx={{
                  bgcolor: player2Color === 'red' ? '#f44336' : '#fdd835',
                  color: player2Color === 'red' ? 'white' : 'black',
                  ml: 1
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

          {showGameOver && (
            <Box sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              bgcolor: 'rgba(0,0,0,0.6)',
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Paper elevation={6} sx={{ p: 4, minWidth: 280, textAlign: 'center' }}>
                <Typography variant="h4" color="error" gutterBottom>
                  Game Over
                </Typography>
                <Typography variant="h6">
                  Returning to home...
                </Typography>
              </Paper>
            </Box>
          )}
        </Paper>

        {isMobile ? (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <GameBoard
                board={gameState.board}
                onColumnClick={() => {}}
                disabled={true}
                lastMove={gameState.lastMove}
                playerColors={{
                  1: player1Color === 'red' ? '#f44336' : '#fdd835',
                  2: player2Color === 'red' ? '#f44336' : '#fdd835'
                }}
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
          <Grid container spacing={2}>
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <GameBoard
                  board={gameState.board}
                  onColumnClick={() => {}}
                  disabled={true}
                  lastMove={gameState.lastMove}
                  playerColors={{
                    1: player1Color === 'red' ? '#f44336' : '#fdd835',
                    2: player2Color === 'red' ? '#f44336' : '#fdd835'
                  }}
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
            </Grid>

            <Box sx={{ mt: 3, width: '100%', display: 'flex', justifyContent: 'center'}}>
              <Leaderboard />
            </Box>
          </Grid>
        )}
      </Box>
    </Box>
  );
}