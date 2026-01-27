import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.connecting = false;
  }

  connect() {
    // Prevent multiple connections
    if (this.socket && this.socket.connected) {
      console.log('Already connected');
      return;
    }

    if (this.connecting) {
      console.log('Connection in progress');
      return;
    }

    this.connecting = true;

    this.socket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.connected = true;
      this.connecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      this.connected = false;
      this.connecting = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connecting = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.connecting = false;
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit:', event);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  removeAllListeners(event) {
    if (this.socket) {
      if (event) {
        this.socket.removeAllListeners(event);
      } else {
        this.socket.removeAllListeners();
      }
    }
  }
}

export default new SocketService();