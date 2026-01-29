const GameLogic = require('../utils/gameLogic');
const { ROWS, COLS, PLAYER_ONE, PLAYER_TWO, EMPTY } = require('../utils/constants');

class BotService {
  static getBotMove(board, maxDepth = 6) {
    // Instant win
    const win = this.findWinningMove(board, PLAYER_TWO);
    if (win !== -1) return win;

    // Instant block
    const block = this.findWinningMove(board, PLAYER_ONE);
    if (block !== -1) return block;

    // Minimax decision
    let bestScore = -Infinity;
    let bestMove = -1;

    const validMoves = this.orderMoves(GameLogic.getValidMoves(board));

    for (const col of validMoves) {
      const result = GameLogic.makeMove(board, col, PLAYER_TWO);
      if (!result.success) continue;

      const score = this.minimax(
        result.board,
        maxDepth - 1,
        -Infinity,
        Infinity,
        false
      );

      if (score > bestScore) {
        bestScore = score;
        bestMove = col;
      }
    }

    return bestMove !== -1 ? bestMove : validMoves[0];
  }

  // ================== MINIMAX ==================

  static minimax(board, depth, alpha, beta, maximizing) {
    const validMoves = GameLogic.getValidMoves(board);

    if (depth === 0 || validMoves.length === 0) {
      return this.evaluateBoard(board);
    }

    if (maximizing) {
      let maxEval = -Infinity;

      for (const col of this.orderMoves(validMoves)) {
        const res = GameLogic.makeMove(board, col, PLAYER_TWO);
        if (!res.success) continue;

        if (GameLogic.checkWinner(res.board, res.row, col, PLAYER_TWO)) {
          return 100000;
        }

        const evalScore = this.minimax(
          res.board,
          depth - 1,
          alpha,
          beta,
          false
        );

        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }

      return maxEval;
    } else {
      let minEval = Infinity;

      for (const col of this.orderMoves(validMoves)) {
        const res = GameLogic.makeMove(board, col, PLAYER_ONE);
        if (!res.success) continue;

        if (GameLogic.checkWinner(res.board, res.row, col, PLAYER_ONE)) {
          return -100000;
        }

        const evalScore = this.minimax(
          res.board,
          depth - 1,
          alpha,
          beta,
          true
        );

        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }

      return minEval;
    }
  }

  // ================== EVALUATION ==================

  static evaluateBoard(board) {
    let score = 0;

    // Center column control
    const center = Math.floor(COLS / 2);
    for (let r = 0; r < ROWS; r++) {
      if (board[r][center] === PLAYER_TWO) score += 6;
      if (board[r][center] === PLAYER_ONE) score -= 6;
    }

    // Score all windows
    score += this.scoreWindows(board);

    return score;
  }

  static scoreWindows(board) {
    let score = 0;

    const scoreWindow = (window) => {
      const bot = window.filter(c => c === PLAYER_TWO).length;
      const opp = window.filter(c => c === PLAYER_ONE).length;
      const empty = window.filter(c => c === EMPTY).length;

      if (bot === 4) return 1000;
      if (bot === 3 && empty === 1) return 50;
      if (bot === 2 && empty === 2) return 10;

      if (opp === 3 && empty === 1) return -80;
      if (opp === 2 && empty === 2) return -15;

      return 0;
    };

    // Horizontal
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        score += scoreWindow([
          board[r][c], board[r][c+1],
          board[r][c+2], board[r][c+3]
        ]);
      }
    }

    // Vertical
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS - 3; r++) {
        score += scoreWindow([
          board[r][c], board[r+1][c],
          board[r+2][c], board[r+3][c]
        ]);
      }
    }

    // Diagonal ↘
    for (let r = 0; r < ROWS - 3; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        score += scoreWindow([
          board[r][c], board[r+1][c+1],
          board[r+2][c+2], board[r+3][c+3]
        ]);
      }
    }

    // Diagonal ↗
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c < COLS - 3; c++) {
        score += scoreWindow([
          board[r][c], board[r-1][c+1],
          board[r-2][c+2], board[r-3][c+3]
        ]);
      }
    }

    return score;
  }

  // ================== HELPERS ==================

  static findWinningMove(board, player) {
    for (let col = 0; col < COLS; col++) {
      if (!GameLogic.isValidMove(board, col)) continue;

      const res = GameLogic.makeMove(board, col, player);
      if (res.success && GameLogic.checkWinner(res.board, res.row, col, player)) {
        return col;
      }
    }
    return -1;
  }

  static orderMoves(moves) {
    const center = Math.floor(COLS / 2);
    return moves.sort((a, b) =>
      Math.abs(a - center) - Math.abs(b - center)
    );
  }
}

module.exports = BotService;