import { Box, Paper } from '@mui/material';

const ROWS = 6;
const COLS = 7;

export default function GameBoard({ board, onColumnClick, disabled, lastMove, winningCells = [] }) {
  const getCellColor = (value) => {
    if (value === 1) return '#f44336'; // Red
    if (value === 2) return '#fdd835'; // Yellow
    return '#ffffff'; // Empty
  };

  const isLastMove = (row, col) => {
    return lastMove && lastMove.row === row && lastMove.column === col;
  };

  const isWinningCell = (row, col) => {
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      <Paper
        elevation={3}
        sx={{
          p: { xs: 1, sm: 2 },
          bgcolor: '#1976d2',
          display: 'inline-block',
          maxWidth: { xs: '100vw', sm: 'unset' },
          overflowX: 'auto',
        }}
      >
        <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 } }}>
          {Array.from({ length: COLS }).map((_, colIndex) => (
            <Box key={colIndex} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Array.from({ length: ROWS }).map((_, rowIndex) => (
                <Box
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => !disabled && onColumnClick(colIndex)}
                  sx={{
                    width: { xs: 36, sm: 48, md: 60 },
                    height: { xs: 36, sm: 48, md: 60 },
                    borderRadius: '50%',
                    bgcolor: isWinningCell(rowIndex, colIndex)
                      ? '#4caf50'
                      : getCellColor(board[rowIndex][colIndex]),
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    border: isLastMove(rowIndex, colIndex) ? '2px solid #000' : 'none',
                    boxShadow: isLastMove(rowIndex, colIndex)
                      ? '0 0 8px rgba(0,0,0,0.5)'
                      : 'inset 0 2px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.2s',
                    '&:hover': disabled
                      ? {}
                      : {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                        },
                  }}
                />
              ))}
            </Box>
          ))}
        </Box>
      </Paper>
      <Box sx={{
        marginLeft: { xs: 2, sm: 4 },
        minWidth: 220,
        maxWidth: 260,
        p: 2,
        border: '1px solid #ccc',
        borderRadius: 2,
        bgcolor: '#f9f9f9',
        fontSize: 16
      }}>
        <b>How to Play</b>
        <ol style={{ margin: 0, paddingLeft: 20 }}>
          <li>Players take turns dropping discs.</li>
          <li>First to connect 4 in a row wins.</li>
          <li>Rows can be horizontal, vertical, or diagonal.</li>
          <li>If the board fills, it’s a draw.</li>
        </ol>
      </Box>
    </Box>
  );
}