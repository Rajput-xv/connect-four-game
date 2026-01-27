# 4 in a Row - Real-Time Multiplayer Game

A modern, real-time Connect 4 game built with the MERN stack. Play live against other players or a smart AI bot!

![Status](https://img.shields.io/badge/Status-Live-success) ![Node](https://img.shields.io/badge/Node-18+-green) ![React](https://img.shields.io/badge/React-18+-blue) ![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)

---

## 🚀 Features

- Real-time multiplayer with matchmaking
- Play against a strategic AI bot if no opponent is found
- Reconnection and rematch support
- Live leaderboard and persistent game history

## 🛠️ Tech Stack

**Backend:** Node.js, Express, Socket.IO, MongoDB, Mongoose  
**Frontend:** React, Vite, Material-UI, Socket.IO Client

---

## ⚡ Quick Start

1. **Clone the repo:**
	```bash
	git clone https://github.com/Rajput-xv/connect-four-game.git
	cd connect-four-game
	```
2. **Start MongoDB** (local or Atlas)
3. **Setup backend:**
	```bash
	cd backend
	npm install
	# Create .env (see below)
	```
4. **Setup frontend:**
	```bash
	cd ../frontend
	npm install
	```
5. **Run both servers:**
	- Backend: `cd backend && npm run dev`
	- Frontend: `cd frontend && npm run dev`
6. **Open** [http://localhost:5173](http://localhost:5173) and play!

---

## 📝 Environment Variables

**backend/.env**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/connect-four
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```
**frontend/.env**
```
VITE_BACKEND_URL=http://localhost:5000
```

---

## 🎯 How to Play

- 7×6 grid, take turns dropping discs
- Connect 4 in a row (vertically, horizontally, or diagonally) to win
- If board fills with no winner, it's a draw

**Matchmaking:** Enter username, find match or play bot if no player joins in 10s

**Rematch & Reconnect:**
  - Rematch: 30s window to accept
  - Reconnect: 30s to rejoin if disconnected

---

## 📁 Project Structure

```
connect-four-game/
├── backend/    # API, WebSocket, DB, AI
├── frontend/   # React app
└── README.md
```

---

## 🔌 API Endpoints

REST:
- `GET /api/leaderboard` – Top players
- `GET /api/player/:username` – Player stats
- `GET /api/games/:username` – Game history
- `GET /health` – Health check

WebSocket:
- `find-match`, `make-move`, `request-rematch`, `reconnect-game`, etc.

---

## 🐛 Troubleshooting

- **MongoDB not connecting?** Ensure it's running and check `.env`.
- **WebSocket issues?** Backend must be running, check CORS and URLs.
- **Port in use?** Free port 5000 if needed.

---

## 📄 License

MIT License. See [LICENSE](LICENSE).

---

**Enjoy the game!**