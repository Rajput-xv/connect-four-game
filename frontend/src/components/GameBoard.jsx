import { Box, Paper } from '@mui/material';

const ROWS = 6;
const COLS = 7;

export default function GameBoard({ board, onColumnClick, disabled, lastMove }) {
  const getCellColor = (value) => {
    if (value === 1) return '#f44336'; // Red
    if (value === 2) return '#fdd835'; // Yellow
    return '#ffffff'; // Empty
  };

  const isLastMove = (row, col) => {
    return lastMove && lastMove.row === row && lastMove.column === col;
  };

  return (
    <Paper elevation={3} sx={{ p: 2, bgcolor: '#1976d2', display: 'inline-block' }}>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <Box key={colIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Array.from({ length: ROWS }).map((_, rowIndex) => (
              <Box
                key={`${rowIndex}-${colIndex}`}
                onClick={() => !disabled && onColumnClick(colIndex)}
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  bgcolor: getCellColor(board[rowIndex][colIndex]),
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  border: isLastMove(rowIndex, colIndex) ? '3px solid #000' : 'none',
                  boxShadow: isLastMove(rowIndex, colIndex) ? '0 0 10px rgba(0,0,0,0.5)' : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s',
                  '&:hover': disabled ? {} : {
                    transform: 'scale(1.05)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                  }
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}