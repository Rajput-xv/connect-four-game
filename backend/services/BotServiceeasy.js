const GameLogic = require('../utils/gameLogic');
const { ROWS, COLS, PLAYER_TWO, PLAYER_ONE, EMPTY } = require('../utils/constants');

class BotServiceEasy {
  static getBotMove(board) {
    // Priority 1: Check if bot can win
    const winningMove = this.findWinningMove(board, PLAYER_TWO);
    if (winningMove !== -1) return winningMove;

    // Priority 2: Block opponent from winning
    const blockingMove = this.findWinningMove(board, PLAYER_ONE);
    if (blockingMove !== -1) return blockingMove;

    // Priority 3: Try to create opportunities
    const strategicMove = this.findStrategicMove(board);
    if (strategicMove !== -1) return strategicMove;

    // Priority 4: Play center column if available
    if (GameLogic.isValidMove(board, 3)) return 3;

    // Priority 5: Random valid move
    const validMoves = GameLogic.getValidMoves(board);
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  static findWinningMove(board, player) {
    for (let col = 0; col < COLS; col++) {
      if (GameLogic.isValidMove(board, col)) {
        const result = GameLogic.makeMove(board, col, player);
        if (result.success) {
          if (GameLogic.checkWinner(result.board, result.row, col, player)) {
            return col;
          }
        }
      }
    }
    return -1;
  }

  static findStrategicMove(board) {
    let bestScore = -Infinity;
    let bestMove = -1;

    for (let col = 0; col < COLS; col++) {
      if (GameLogic.isValidMove(board, col)) {
        const result = GameLogic.makeMove(board, col, PLAYER_TWO);
        if (result.success) {
          const score = this.evaluatePosition(result.board, result.row, col);
          if (score > bestScore) {
            bestScore = score;
            bestMove = col;
          }
        }
      }
    }

    return bestMove;
  }

  static evaluatePosition(board, row, col) {
    let score = 0;

    // Evaluate all directions
    score += this.evaluateDirection(board, row, col, 0, 1, PLAYER_TWO); // Horizontal
    score += this.evaluateDirection(board, row, col, 1, 0, PLAYER_TWO); // Vertical
    score += this.evaluateDirection(board, row, col, 1, 1, PLAYER_TWO); // Diagonal \
    score += this.evaluateDirection(board, row, col, 1, -1, PLAYER_TWO); // Diagonal /

    return score;
  }

  static evaluateDirection(board, row, col, deltaRow, deltaCol, player) {
    let count = 1;
    let openEnds = 0;

    // Count in positive direction
    let r = row + deltaRow;
    let c = col + deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (board[r][c] === player) {
        count++;
      } else if (board[r][c] === EMPTY) {
        openEnds++;
        break;
      } else {
        break;
      }
      r += deltaRow;
      c += deltaCol;
    }

    // Count in negative direction
    r = row - deltaRow;
    c = col - deltaCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      if (board[r][c] === player) {
        count++;
      } else if (board[r][c] === EMPTY) {
        openEnds++;
        break;
      } else {
        break;
      }
      r -= deltaRow;
      c -= deltaCol;
    }

    // Score based on count and open ends
    if (count >= 3 && openEnds > 0) return 50;
    if (count === 2 && openEnds === 2) return 10;
    if (count === 2 && openEnds === 1) return 5;
    
    return count;
  }
}

module.exports = BotServiceEasy;