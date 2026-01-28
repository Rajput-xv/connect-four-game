import { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';

export default function SpectatorChat({ gameId, username, messages, onSendMessage }) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && inputMessage.length <= 200) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Paper elevation={2} sx={{ display: 'flex', flexDirection: 'column', maxHeight: 600, minHeight: 400 }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'primary.main', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <ChatIcon />
        <Typography variant="h6">
          Spectator Chat
        </Typography>
        <Chip 
          label={`${messages.length} messages`} 
          size="small"
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            color: 'white',
            ml: 'auto'
          }}
        />
      </Box>

      <Divider />

      {/* Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          bgcolor: '#f5f5f5',
          minHeight: 200,
          maxHeight: 400
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'text.secondary' 
          }}>
            <ChatIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body2">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((msg) => (
              <ListItem
                key={msg.messageId}
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  p: 1,
                  mb: 1,
                  bgcolor: msg.username === username ? '#e3f2fd' : 'white',
                  borderRadius: 1,
                  borderLeft: msg.username === username ? '3px solid #1976d2' : '3px solid #ccc'
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      color: msg.username === username ? 'primary.main' : 'text.primary'
                    }}
                  >
                    {msg.username}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ ml: 'auto', color: 'text.secondary', fontSize: '0.7rem' }}
                  >
                    {formatTime(msg.timestamp)}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ wordBreak: 'break-word', width: '100%' }}>
                  {msg.message}
                </Typography>
              </ListItem>
            ))}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      <Divider />

      {/* Input Area */}
      <Box
        component="form"
        onSubmit={handleSend}
        sx={{
          p: 2,
          display: 'flex',
          gap: 1,
          bgcolor: 'background.paper'
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message... (max 200 chars)"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          inputProps={{ maxLength: 200 }}
          helperText={`${inputMessage.length}/200`}
          FormHelperTextProps={{ sx: { textAlign: 'right', mr: 0 } }}
        />
        <IconButton
          type="submit"
          color="primary"
          disabled={!inputMessage.trim()}
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            '&:hover': { bgcolor: 'primary.dark' },
            '&:disabled': { bgcolor: 'action.disabledBackground' }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}