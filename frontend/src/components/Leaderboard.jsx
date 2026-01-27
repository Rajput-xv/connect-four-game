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

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/leaderboard');
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
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Typography variant="h5" gutterBottom align="center">
        Leaderboard
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Rank</strong></TableCell>
              <TableCell><strong>Player</strong></TableCell>
              <TableCell align="center"><strong>Wins</strong></TableCell>
              <TableCell align="center"><strong>Losses</strong></TableCell>
              <TableCell align="center"><strong>Draws</strong></TableCell>
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
                  <TableCell align="center">{player.gamesDrawn}</TableCell>
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