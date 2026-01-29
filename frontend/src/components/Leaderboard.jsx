import { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress
} from '@mui/material';

export default function Leaderboard({ refreshTrigger }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [refreshTrigger]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: { xs: 1, sm: 2 }, mt: 3, mb: 5 }}>
      <Typography
        variant="h5"
        gutterBottom
        align="center"
        sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}
      >
        Leaderboard
      </Typography>
      <TableContainer 
        sx={{ 
          maxWidth: '100vw', 
          overflowX: 'auto', 
          maxHeight: 350,
          overflowY: 'auto',
        }}
      >
        <Table size="small" sx={{ minWidth: 400 }} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell><strong>Rank</strong></TableCell>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell align="center"><strong>Wins</strong></TableCell>
              <TableCell align="center"><strong>Losses</strong></TableCell>
              {/* <TableCell align="center"><strong>Draws</strong></TableCell> */}
              <TableCell align="center"><strong>Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboard.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No players yet. Be the first!
                </TableCell>
              </TableRow>
            ) : (
              leaderboard.map((player, index) => (
                <TableRow key={player._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{player.username}</TableCell>
                  <TableCell align="center">{player.gamesWon}</TableCell>
                  <TableCell align="center">{player.gamesLost}</TableCell>
                  {/* <TableCell align="center">{player.gamesDrawn}</TableCell> */}
                  <TableCell align="center">{player.totalGames}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}