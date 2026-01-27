import { useState } from 'react';
import { Box, TextField, Button, Paper, Typography } from '@mui/material';

export default function UsernameInput({ onSubmit }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onSubmit(username.trim());
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: '#f5f5f5',
        px: 1
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 4 },
          maxWidth: { xs: '98vw', sm: 400 },
          width: '100%',
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          align="center"
          sx={{ fontSize: { xs: '1.3rem', sm: '2.125rem' } }}
        >
          4 in a Row
        </Typography>
        <Typography
          variant="body1"
          gutterBottom
          align="center"
          color="text.secondary"
          sx={{ fontSize: { xs: '0.95rem', sm: '1rem' } }}
        >
          Enter your username to start playing
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            margin="normal"
            autoFocus
            required
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
            sx={{ mt: 2 }}
          >
            Find Match
          </Button>
        </form>
      </Paper>
    </Box>
  );
}