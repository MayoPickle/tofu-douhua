const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// 添加请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

const JWT_SECRET = 'your-secret-key-change-in-production';
const PORT = process.env.PORT || 3001;

const db = new sqlite3.Database('./discord.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    username TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS channel_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    user_id INTEGER,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    user_id INTEGER,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(channel_id) REFERENCES channels(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post('/api/register', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, username } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (email, password, username) VALUES (?, ?, ?)',
      [email, hashedPassword, username],
      function(err) {
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT') {
            return res.status(400).json({ error: 'Email already exists' });
          }
          return res.status(500).json({ error: 'Internal server error' });
        }
        
        const token = jwt.sign({ userId: this.lastID, email }, JWT_SECRET);
        res.json({ token, user: { id: this.lastID, email, username } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, username: user.username } 
    });
  });
});

app.get('/api/channels', authenticateToken, (req, res) => {
  db.all(`
    SELECT c.*, u.username as creator_name 
    FROM channels c 
    JOIN users u ON c.created_by = u.id
  `, (err, channels) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(channels);
  });
});

app.post('/api/channels', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;

  db.run(
    'INSERT INTO channels (name, description, created_by) VALUES (?, ?, ?)',
    [name, description || '', userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
      
      db.run(
        'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)',
        [this.lastID, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.json({ id: this.lastID, name, description, created_by: userId });
        }
      );
    }
  );
});

app.post('/api/channels/:id/join', authenticateToken, (req, res) => {
  const channelId = req.params.id;
  const userId = req.user.userId;

  db.get(
    'SELECT * FROM channel_members WHERE channel_id = ? AND user_id = ?',
    [channelId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (member) {
        return res.status(400).json({ error: 'Already a member of this channel' });
      }

      db.run(
        'INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)',
        [channelId, userId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.json({ message: 'Successfully joined channel' });
        }
      );
    }
  );
});

app.get('/api/channels/:id/messages', authenticateToken, (req, res) => {
  const channelId = req.params.id;

  db.all(`
    SELECT m.*, u.username 
    FROM messages m 
    JOIN users u ON m.user_id = u.id 
    WHERE m.channel_id = ? 
    ORDER BY m.created_at ASC
  `, [channelId], (err, messages) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(messages);
  });
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-joined', (userData) => {
    connectedUsers.set(socket.id, userData);
    socket.broadcast.emit('user-online', userData);
  });

  socket.on('join-channel', (channelId) => {
    socket.join(`channel-${channelId}`);
    console.log(`User ${socket.id} joined channel ${channelId}`);
  });

  socket.on('leave-channel', (channelId) => {
    socket.leave(`channel-${channelId}`);
    console.log(`User ${socket.id} left channel ${channelId}`);
  });

  socket.on('send-message', (messageData) => {
    const { channelId, content, userId } = messageData;
    
    db.run(
      'INSERT INTO messages (channel_id, user_id, content) VALUES (?, ?, ?)',
      [channelId, userId, content],
      function(err) {
        if (!err) {
          db.get(`
            SELECT m.*, u.username 
            FROM messages m 
            JOIN users u ON m.user_id = u.id 
            WHERE m.id = ?
          `, [this.lastID], (err, message) => {
            if (!err) {
              io.to(`channel-${channelId}`).emit('new-message', message);
            }
          });
        }
      }
    );
  });

  socket.on('webrtc-signal', (data) => {
    socket.to(`channel-${data.channelId}`).emit('webrtc-signal', {
      signal: data.signal,
      from: socket.id,
      userId: data.userId
    });
  });

  socket.on('disconnect', () => {
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      socket.broadcast.emit('user-offline', userData);
      connectedUsers.delete(socket.id);
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});