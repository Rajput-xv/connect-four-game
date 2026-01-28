import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Paper, Fade } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function TimedPopup({ open, onClose, message, duration = 3000 }) {
  const [visible, setVisible] = useState(open);
  useEffect(() => {
    if (open) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onClose && onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  return (
    <Fade in={visible} timeout={300} unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          bgcolor: 'rgba(0,0,0,0.18)',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper elevation={6} sx={{ p: 3, minWidth: 280, position: 'relative', textAlign: 'center' }}>
          <IconButton
            aria-label="close"
            onClick={() => { setVisible(false); onClose && onClose(); }}
            sx={{ position: 'absolute', top: 8, right: 8 }}
            size="small"
          >
            <CloseIcon />
          </IconButton>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            {message}
          </Typography>
        </Paper>
      </Box>
    </Fade>
  );
}
