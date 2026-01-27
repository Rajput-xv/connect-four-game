const { ROWS, COLS, EMPTY } = require('./constants');

class GameLogic {
  static createEmptyBoard() {
    return Array(ROWS).fill(null).map(() => Array(COLS).fill(EMPTY));
  }

  static isValidMove(board, column) {
    return column >= 0 && column < COLS && board[0][column] === EMPTY;
  }

  static makeMove(board, column, player) {
    const newBoard = board.map(row => [...row]);
    
    for (let row = ROWS - 1; row >= 0; row--) {
      if (newBoard[row][column] === EMPTY) {
        newBoard[row][column] = player;
        return { success: true, board: newBoard, row };
      }
    }
    
    return { success: false, board, row: -1 };
  }

  static checkWinner(board, lastRow, lastCol, player) {
    // Check horizontal
    if (this.checkDirection(board, lastRow, lastCol, 0, 1, player)) return true;
    
    // Check vertical
    if (this.checkDirection(board, lastRow, lastCol, 1, 0, player)) return true;
    
    // Check diagonal (top-left to bottom-right)
    if (this.checkDirection(board, lastRow, lastCol, 1, 1, player)) return true;
    
    // Check diagonal (top-right to bottom-left)
    if (this.checkDirection(board, lastRow, lastCol, 1, -1, player)) return true;
    
    return false;
  }

  static checkDirection(board, row, col, deltaRow, deltaCol, player) {
    let count = 1;
    
    // Check positive direction
    count += this.countInDirection(board, row, col, deltaRow, deltaCol, player);
    
    // Check negative direction
    count += this.countInDirection(board, row, col, -deltaRow, -deltaCol, player);
    
    return count >= 4;
  }

  static countInDirection(board, row, col, deltaRow, deltaCol, player) {
    let count = 0;
    let r = row + deltaRow;
    let c = col + deltaCol;
    
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player) {
      count++;
      r += deltaRow;
      c += deltaCol;
    }
    
    return count;
  }

  static isBoardFull(board) {
    return board[0].every(cell => cell !== EMPTY);
  }

  static getValidMoves(board) {
    const validMoves = [];
    for (let col = 0; col < COLS; col++) {
      if (this.isValidMove(board, col)) {
        validMoves.push(col);
      }
    }
    return validMoves;
  }
}

module.exports = GameLogic;