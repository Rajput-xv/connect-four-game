import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function SpectatorList({ onBack, onSelectGame, games, loading }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        p: 2
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1 }}>
            Live Games
          </Typography>
          <Chip
            label={`${games.length} Active`}
            color="success"
            size="small"
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : games.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No active games right now
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Start a game or check back later!
            </Typography>
          </Box>
        ) : (
          <List>
            {games.map((game) => (
              <Paper
                key={game.gameId}
                elevation={1}
                sx={{ mb: 2, p: 2, '&:hover': { bgcolor: '#f9f9f9' } }}
              >
                <ListItem sx={{ p: 0 }}>
                  <Box
                    sx={{
                      width: '100%',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: 2
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">
                        {game.player1} vs {game.player2}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={`Move ${game.moveCount}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Chip
                          label={`${game.spectatorCount} watching`}
                          size="small"
                          icon={<VisibilityIcon />}
                        />
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: { xs: 'flex-end', sm: 'flex-end' },
                        mt: { xs: 2, sm: 0 }
                      }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<VisibilityIcon />}
                        onClick={() => onSelectGame(game.gameId)}
                        fullWidth={true}
                        sx={{ minWidth: 120 }}
                      >
                        Watch
                      </Button>
                    </Box>
                  </Box>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}