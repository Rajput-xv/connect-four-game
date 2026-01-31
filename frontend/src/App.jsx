import { useState, useEffect, useRef } from 'react';
import { Container, Box, Button, Typography, Alert } from '@mui/material';
import UsernameInput from './components/UsernameInput';
import TimedPopup from './components/TimedPopup';
import GameBoard from './components/GameBoard';
import GameStatus from './components/GameStatus';
import Leaderboard from './components/Leaderboard';
import socketService from './services/socketService';
import SpectatorList from './components/SpectatorList';
import SpectatorView from './components/SpectatorView';

// Helper to get winning cells
function getWinningCells(board, lastMove, winner) {
  if (!lastMove || !winner || winner === 'draw') return [];
  const directions = [
    { dr: 0, dc: 1 },   // horizontal
    { dr: 1, dc: 0 },   // vertical
    { dr: 1, dc: 1 },   // diagonal down-right
    { dr: 1, dc: -1 },  // diagonal down-left
  ];
  const ROWS = board.length;
  const COLS = board[0].length;
  const player = board[lastMove.row][lastMove.column];
  for (const { dr, dc } of directions) {
    let cells = [[lastMove.row, lastMove.column]];
    // Forward
    let r = lastMove.row + dr, c = lastMove.column + dc;
    while (
      r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player
    ) {
      cells.push([r, c]);
      r += dr;
      c += dc;
    }
    // Backward
    r = lastMove.row - dr;
    c = lastMove.column - dc;
    while (
      r >= 0 && r < ROWS && c >= 0 && c < COLS && board[r][c] === player
    ) {
      cells.push([r, c]);
      r -= dr;
      c -= dc;
    }
    if (cells.length >= 4) return cells;
  }
  return [];
}

function App() {
  // Load from localStorage if available
  const getInitialUsername = () => localStorage.getItem('username') || '';
  const getInitialGameId = () => localStorage.getItem('gameId') || null;
  const getInitialGameStatus = () => localStorage.getItem('gameStatus') || 'waiting';

  // Track if resume is available
  const [resumeAvailable, setResumeAvailable] = useState(() => {
    const username = localStorage.getItem('username');
    const gameId = localStorage.getItem('gameId');
    const gameStatus = localStorage.getItem('gameStatus');
    return !!(username && gameId && gameStatus !== 'completed' && gameStatus !== 'forfeited');
  });

  const [gameStage, setGameStage] = useState('username'); // username, waiting, playing, finished
  const [username, setUsername] = useState(getInitialUsername());
  const [gameState, setGameState] = useState({
    gameId: getInitialGameId(),
    board: Array(6).fill(null).map(() => Array(7).fill(0)),
    currentTurn: 1,
    status: getInitialGameStatus(),
    winner: null,
    lastMove: null
  });
  // Board lock to prevent double moves before bot responds
  const [boardLocked, setBoardLocked] = useState(false);
  // Add responsive style for mobile margin-bottom
  const responsiveStyle = `
  @media (max-width: 600px) {
    .main-body {
      margin-bottom: 1.25rem;
    }
  }
  `;

  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = responsiveStyle;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);
  const [opponent, setOpponent] = useState('');
  const [playerNumber, setPlayerNumber] = useState(null);
  const [yourColor, setYourColor] = useState('');
  const [opponentColor, setOpponentColor] = useState('');
  const [error, setError] = useState('');
  const [isBot, setIsBot] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchReceived, setRematchReceived] = useState(false);
  const [rematchFrom, setRematchFrom] = useState('');
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0); 
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [spectatorGameId, setSpectatorGameId] = useState(null);
  const [activeGames, setActiveGames] = useState([]);
  const [spectatorGameState, setSpectatorGameState] = useState({
    board: Array(6).fill(null).map(() => Array(7).fill(0)),
    currentTurn: 1,
    status: 'active',
    winner: null,
    lastMove: null
  });
  const [spectatorPlayers, setSpectatorPlayers] = useState({
    player1: '',
    player2: '',
    player1Color: '',
    player2Color: ''
  });
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [showSpectatorList, setShowSpectatorList] = useState(false);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  // Timer states
  const [waitingTimer, setWaitingTimer] = useState(10);
  const [rematchTimer, setRematchTimer] = useState(30);
    // Handle waiting for opponent timer
    useEffect(() => {
      if (gameStage === 'waiting') {
        setWaitingTimer(10);
        const interval = setInterval(() => {
          setWaitingTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [gameStage]);

    // Handle rematch timer (for both request and receive)
    useEffect(() => {
      if ((rematchRequested || rematchReceived) && gameStage === 'finished') {
        setRematchTimer(30);
        const interval = setInterval(() => {
          setRematchTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        return () => clearInterval(interval);
      }
    }, [rematchRequested, rematchReceived, gameStage]);
  
  // Use ref to track if socket handlers are set up
  const handlersSetup = useRef(false);

  // Main socket event handlers (no reconnect logic here)
  useEffect(() => {
    socketService.connect();
    if (!handlersSetup.current) {
      handlersSetup.current = true;

      socketService.on('waiting-for-opponent', () => {
        setGameStage('waiting');
        setError('');
      });

      socketService.on('match-found', (data) => {
        setGameState(prev => ({
          ...prev,
          gameId: data.gameId,
          status: 'active',
          currentTurn: 1
        }));
        localStorage.setItem('gameId', data.gameId);
        localStorage.setItem('gameStatus', 'active');
        setOpponent(data.opponent);
        setPlayerNumber(data.playerNumber);
        setYourColor(data.yourColor);
        setOpponentColor(data.opponentColor);
        setIsBot(data.isBot || false);
        setGameStage('playing');
        setError('');
        setBoardLocked(false);
      });

      socketService.on('move-made', (data) => {
        setGameState(prev => ({
          ...prev,
          board: data.board,
          currentTurn: data.currentTurn,
          lastMove: data.lastMove
        }));
        setBoardLocked(false);
      });

      socketService.on('game-over', (data) => {
        setGameState(prev => ({
          ...prev,
          board: data.board,
          status: 'completed',
          winner: data.winner
        }));
        localStorage.setItem('gameStatus', 'completed');
        setGameStage('finished');
        setLeaderboardRefresh(prev => prev + 1);
      });

      socketService.on('opponent-disconnected', (data) => {
        setError(data.message);
        setGameState(prev => ({
          ...prev,
          status: 'completed',
          winner: data.winner || prev.winner
        }));
        localStorage.setItem('gameStatus', 'completed');
        setGameStage('finished');
      });

      socketService.on('error', (data) => {
        setError(data.message);
      });

      socketService.on('rematch-requested', (data) => {
        setRematchReceived(true);
        setRematchFrom(data.from);
      });

      socketService.on('rematch-request-sent', () => {
        setRematchRequested(true);
      });

      socketService.on('rematch-accepted', (data) => {
        setRematchRequested(false);
        setRematchReceived(false);
        setRematchFrom('');
        setGameState({
          gameId: data.gameId,
          board: Array(6).fill(null).map(() => Array(7).fill(0)),
          currentTurn: 1,
          status: 'active',
          winner: null,
          lastMove: null
        });
        localStorage.setItem('gameId', data.gameId);
        localStorage.setItem('gameStatus', 'active');
        setOpponent(data.opponent);
        setPlayerNumber(data.playerNumber);
        setYourColor(data.yourColor);
        setOpponentColor(data.opponentColor);
        setGameStage('playing');
        setError('');
      });

      socketService.on('rematch-declined', () => {
        setRematchRequested(false);
        setRematchReceived(false);
        setError('Opponent declined rematch');
        setTimeout(() => {
          handleReturnHome();
        }, 2000);
      });

      socketService.on('rematch-timeout', () => {
        setRematchRequested(false);
        setRematchReceived(false);
        setError('Rematch request timed out');
        setTimeout(() => {
          handleReturnHome();
        }, 2000);
      });

      socketService.on('active-games-list', (data) => {
        setActiveGames(data.games);
        setGamesLoading(false);
      });

      socketService.on('spectate-started', (data) => {
        setSpectatorGameState({
          board: data.board,
          currentTurn: data.currentTurn,
          status: 'active',
          winner: null,
          lastMove: data.moveHistory[data.moveHistory.length - 1] || null
        });
        setSpectatorPlayers({
          player1: data.player1,
          player2: data.player2,
          player1Color: data.player1Color,
          player2Color: data.player2Color
        });
        setSpectatorCount(data.spectatorCount);
        setSpectatorMode(true);
        setShowSpectatorList(false);
        setChatMessages([]); // Reset chat for new spectate
      });

      socketService.on('spectate-move-made', (data) => {
        setSpectatorGameState(prev => ({
          ...prev,
          board: data.board,
          currentTurn: data.currentTurn,
          lastMove: data.lastMove
        }));
      });

      socketService.on('spectate-game-over', (data) => {
        setSpectatorGameState(prev => ({
          ...prev,
          board: data.board,
          status: 'completed',
          winner: data.winner
        }));
        setTimeout(() => {
          handleBackFromSpectator();
        }, 2000);
      });

      socketService.on('spectator-joined', (data) => {
        setSpectatorCount(data.spectatorCount);
      });

      socketService.on('spectator-left', (data) => {
        setSpectatorCount(data.spectatorCount);
      });

      socketService.on('spectator-chat-received', (message) => {
        setChatMessages(prev => [...prev, message]);
      });

      socketService.on('game-reconnected', (data) => {
        console.log('Game reconnected:', data);
        setGameState(prev => ({
          ...prev,
          gameId: data.gameId,
          board: data.board,
          currentTurn: data.currentTurn,
          status: 'active',
          winner: null,
          lastMove: null
        }));
        setOpponent(data.opponent);
        setPlayerNumber(data.playerNumber);
        setYourColor(data.yourColor);
        setOpponentColor(data.opponentColor);
        setIsBot(data.isBot || false);
        localStorage.setItem('gameId', data.gameId);
        localStorage.setItem('gameStatus', 'active');
        setGameStage('playing');
        setError('');
        setResumeAvailable(false);
      });

      socketService.on('opponent-disconnected-temp', (data) => {
        console.log('Opponent temporarily disconnected:', data);
        setError(data.message);
      });

      socketService.on('opponent-reconnected', (data) => {
        console.log('Opponent reconnected:', data);
        setError('');
      });
    }
    // Cleanup on unmount
    return () => {
      if (import.meta.env.PROD) {
        socketService.disconnect();
      }
    };
  }, []);

  // Auto-reconnect logic: only run on initial mount
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    const storedGameId = localStorage.getItem('gameId');
    const storedGameStatus = localStorage.getItem('gameStatus');
    
    if (
      storedUsername &&
      storedGameId &&
      storedGameStatus !== 'completed' &&
      storedGameStatus !== 'forfeited'
    ) {
      console.log('Attempting to reconnect to game:', storedGameId);
      socketService.emit('reconnect-game', { 
        gameId: storedGameId, 
        username: storedUsername 
      });
    }
  }, []);

  const handleUsernameSubmit = (name) => {
    setUsername(name);
    setError('');
    localStorage.setItem('username', name);
    // Clear any previous gameId on new match
    localStorage.removeItem('gameId');
    localStorage.removeItem('gameStatus');
    socketService.emit('find-match', { username: name });
    setGameStage('waiting');
  };

  const handleColumnClick = (column) => {
    // Prevent move if board is locked (waiting for bot)
    if (boardLocked) return;

    // Check if it's the player's turn
    if (gameState.currentTurn !== playerNumber) {
      setError("It's not your turn!");
      setTimeout(() => setError(''), 2000);
      return;
    }

    // Check if game is active
    if (gameState.status !== 'active') {
      setError('Game is not active');
      setTimeout(() => setError(''), 2000);
      return;
    }

    // Lock board if playing bot (prevents double move before bot responds)
    if (isBot) setBoardLocked(true);

    socketService.emit('make-move', {
      gameId: gameState.gameId,
      column
    });
  };

  const handleRequestRematch = () => {
    if (isBot) {
      // If playing against bot, just start new game
      handleReturnHome();
      return;
    }

    socketService.emit('request-rematch', { gameId: gameState.gameId });
  };

  const handleAcceptRematch = () => {
    socketService.emit('accept-rematch', { gameId: gameState.gameId });
    setRematchReceived(false);
  };

  const handleDeclineRematch = () => {
    socketService.emit('decline-rematch', { gameId: gameState.gameId });
    setRematchReceived(false);
    handleReturnHome();
  };

  const handleReturnHome = () => {
    setGameStage('username');
    setGameState({
      gameId: null,
      board: Array(6).fill(null).map(() => Array(7).fill(0)),
      currentTurn: 1,
      status: 'waiting',
      winner: null,
      lastMove: null
    });
    setOpponent('');
    setPlayerNumber(null);
    setYourColor('');
    setOpponentColor('');
    setError('');
    setIsBot(false);
    setRematchRequested(false);
    setRematchReceived(false);
    setRematchFrom('');
    localStorage.removeItem('gameId');
    localStorage.removeItem('gameStatus');
  };

  const handleShowSpectatorList = () => {
    setGamesLoading(true);
    setShowSpectatorList(true);
    socketService.emit('get-active-games');
  };

  // Auto-refresh active games list when spectator list is shown
  useEffect(() => {
    if (showSpectatorList && !spectatorMode) {
      const interval = setInterval(() => {
        socketService.emit('get-active-games');
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showSpectatorList, spectatorMode]);

  const handleSelectSpectatorGame = (gameId) => {
    setSpectatorGameId(gameId);
    setChatMessages([]);
    socketService.emit('join-spectate', {
      gameId,
      username: username || 'Anonymous'
    });
  };

  const handleBackFromSpectatorList = () => {
    setShowSpectatorList(false);
    setActiveGames([]);
  };

  const handleBackFromSpectator = () => {
    if (spectatorGameId) {
      socketService.emit('leave-spectate', { gameId: spectatorGameId });
    }
    setSpectatorMode(false);
    setSpectatorGameId(null);
    setShowSpectatorList(true);
    setChatMessages([]);
    setSpectatorGameState({
      board: Array(6).fill(null).map(() => Array(7).fill(0)),
      currentTurn: 1,
      status: 'active',
      winner: null,
      lastMove: null
    });
    setSpectatorPlayers({
      player1: '',
      player2: '',
      player1Color: '',
      player2Color: ''
    });
    setSpectatorCount(0);
    socketService.emit('get-active-games');
  };

  const handleSendChatMessage = (message) => {
    if (!spectatorGameId || !username) return;
    
    socketService.emit('spectator-chat-message', {
      gameId: spectatorGameId,
      username: username || 'Anonymous',
      message
    });
  };

  // If user wants to spectate but hasn't provided a username, prompt for it
  const [pendingSpectate, setPendingSpectate] = useState(false);
  const [showSpectatePopup, setShowSpectatePopup] = useState(false);
  const handleSpectateClick = () => {
    if (!username) {
      setShowSpectatePopup(true);
      setPendingSpectate(false);
    } else {
      handleShowSpectatorList();
    }
  } 

  if (showSpectatorList) {
    return (
      <SpectatorList
        games={activeGames}
        loading={gamesLoading}
        onBack={handleBackFromSpectatorList}
        onSelectGame={handleSelectSpectatorGame}
      />
    );
  }

  if (spectatorMode) {
    return (
      <SpectatorView
        gameState={spectatorGameState}
        player1={spectatorPlayers.player1}
        player2={spectatorPlayers.player2}
        player1Color={spectatorPlayers.player1Color}
        player2Color={spectatorPlayers.player2Color}
        spectatorCount={spectatorCount}
        onBack={handleBackFromSpectator}
        username={username}
        gameId={spectatorGameId}
        chatMessages={chatMessages}
        onSendChatMessage={handleSendChatMessage}
      />
    );
  }

  if (gameStage === 'username' || pendingSpectate) {
    return (
      <Box>
        <UsernameInput 
          onSubmit={(name, spectate) => {
            setUsername(name);
            setPendingSpectate(false);
            if (spectate) {
              handleShowSpectatorList();
            } else {
              handleUsernameSubmit(name);
            }
          }}
          onSpectate={handleSpectateClick}
        />
        {resumeAvailable && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                // Resume previous game
                const storedUsername = localStorage.getItem('username');
                const storedGameId = localStorage.getItem('gameId');
                if (storedUsername && storedGameId) {
                  socketService.emit('reconnect-game', { gameId: storedGameId, username: storedUsername });
                  // The socket event will handle updating state on success
                }
              }}
            >
              Resume Game
            </Button>
          </Box>
        )}
        <TimedPopup
          open={showSpectatePopup}
          onClose={() => setShowSpectatePopup(false)}
          message={"Please enter a username before spectating live games."}
          duration={3000}
        />
        <Container maxWidth="md">
          <Leaderboard refreshTrigger={leaderboardRefresh} />
        </Container>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mb: 5 }}>
      <Typography variant="h3" align="center" gutterBottom>
        4 in a Row
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {gameStage === 'waiting' && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" gutterBottom>
            Finding an opponent...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            If no player joins in <b>{waitingTimer}s</b>, you'll play against a bot
          </Typography>
        </Box>
      )}

      {(gameStage === 'playing' || gameStage === 'finished') && (
        <Box sx={{ mb: 4 }} className="main-body">
          <GameStatus
            gameState={gameState}
            username={username}
            opponent={opponent}
            playerNumber={playerNumber}
            yourColor={yourColor}
            opponentColor={opponentColor}
            spectateCount={spectatorCount}
          />

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <GameBoard
              board={gameState.board}
              onColumnClick={handleColumnClick}
              disabled={boardLocked || gameState.currentTurn !== playerNumber || gameState.status !== 'active'}
              lastMove={gameState.lastMove}
              winningCells={getWinningCells(gameState.board, gameState.lastMove, gameState.winner)}
              playerColors={{
                1: playerNumber === 1 ? yourColor : opponentColor,
                2: playerNumber === 2 ? yourColor : opponentColor
              }}
            />
          </Box>

          {gameStage === 'finished' && (
            <Box sx={{ textAlign: 'center' }}>
              {rematchRequested ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Waiting for opponent to accept rematch... (<b>{rematchTimer}s</b>)
                </Alert>
              ) : rematchReceived ? (
                <Box>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    {rematchFrom} wants a rematch! (<b>{rematchTimer}s</b> to respond)
                  </Alert>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="large"
                      onClick={handleAcceptRematch}
                    >
                      Accept Rematch
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="large"
                      onClick={handleDeclineRematch}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {isBot ? (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={() => {
                          // Reset board and state before starting new bot game
                          setGameState({
                            gameId: null,
                            board: Array(6).fill(null).map(() => Array(7).fill(0)),
                            currentTurn: 1,
                            status: 'waiting',
                            winner: null,
                            lastMove: null
                          });
                          setOpponent('');
                          setPlayerNumber(null);
                          setYourColor('');
                          setOpponentColor('');
                          setError('');
                          setIsBot(false);
                          setRematchRequested(false);
                          setRematchReceived(false);
                          setRematchFrom('');
                          // Immediately start a new bot game
                          socketService.emit('start-bot-game', { username });
                          setGameStage('playing');
                        }}
                      >
                        Play Again
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => {
                          // Start matchmaking immediately, show waiting screen
                          setGameState({
                            gameId: null,
                            board: Array(6).fill(null).map(() => Array(7).fill(0)),
                            currentTurn: 1,
                            status: 'waiting',
                            winner: null,
                            lastMove: null
                          });
                          setOpponent('');
                          setPlayerNumber(null);
                          setYourColor('');
                          setOpponentColor('');
                          setError('');
                          setIsBot(false);
                          setRematchRequested(false);
                          setRematchReceived(false);
                          setRematchFrom('');
                          localStorage.removeItem('gameId');
                          localStorage.removeItem('gameStatus');
                          socketService.emit('find-match', { username });
                          setGameStage('waiting');
                        }}
                      >
                        Find New Opponent
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleRequestRematch}
                      >
                        Request Rematch
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => {
                          // Start matchmaking immediately, show waiting screen
                          setGameState({
                            gameId: null,
                            board: Array(6).fill(null).map(() => Array(7).fill(0)),
                            currentTurn: 1,
                            status: 'waiting',
                            winner: null,
                            lastMove: null
                          });
                          setOpponent('');
                          setPlayerNumber(null);
                          setYourColor('');
                          setOpponentColor('');
                          setError('');
                          setIsBot(false);
                          setRematchRequested(false);
                          setRematchReceived(false);
                          setRematchFrom('');
                          localStorage.removeItem('gameId');
                          localStorage.removeItem('gameStatus');
                          socketService.emit('find-match', { username });
                          setGameStage('waiting');
                        }}
                      >
                        Find New Opponent
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleReturnHome}
                  >
                    Return Home
                  </Button>
                </Box>
              )}
            </Box>
          )}

          <Leaderboard refreshTrigger={leaderboardRefresh} />
        </Box>
      )}
    </Container>
  );
}

export default App;