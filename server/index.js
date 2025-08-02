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

  // 服务器表
  db.run(`CREATE TABLE IF NOT EXISTS servers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    owner_id INTEGER NOT NULL,
    invite_code TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(owner_id) REFERENCES users(id)
  )`);

  // 服务器成员表
  db.run(`CREATE TABLE IF NOT EXISTS server_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(server_id) REFERENCES servers(id),
    FOREIGN KEY(user_id) REFERENCES users(id),
    UNIQUE(server_id, user_id)
  )`);

  // 检查并添加server_id列到channels表
  db.run(`PRAGMA table_info(channels)`, (err, rows) => {
    if (!err) {
      db.all(`PRAGMA table_info(channels)`, (err, columns) => {
        if (!err) {
          const hasServerId = columns.some(col => col.name === 'server_id');
          if (!hasServerId) {
            db.run(`ALTER TABLE channels ADD COLUMN server_id INTEGER REFERENCES servers(id)`);
          }
        }
      });
    }
  });

  db.run(`CREATE TABLE IF NOT EXISTS channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_by INTEGER,
    server_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(created_by) REFERENCES users(id),
    FOREIGN KEY(server_id) REFERENCES servers(id)
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

  // 创建默认豆腐花服务器
  db.get(`SELECT COUNT(*) as count FROM servers WHERE name = '豆腐花'`, (err, row) => {
    if (!err && row.count === 0) {
      db.run(`INSERT INTO servers (name, description, owner_id, invite_code) VALUES (?, ?, ?, ?)`,
        ['豆腐花', '欢迎来到豆腐花服务器！这是默认的聊天服务器。', 1, 'tofu-douhua-default'],
        function(err) {
          if (!err) {
            console.log('默认豆腐花服务器已创建，ID:', this.lastID);
          }
        }
      );
    }
  });
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
        
        const userId = this.lastID;
        const token = jwt.sign({ userId, email }, JWT_SECRET);

        // 自动将新用户加入默认豆腐花服务器
        db.get('SELECT id FROM servers WHERE name = "豆腐花"', (err, defaultServer) => {
          if (!err && defaultServer) {
            db.run(
              'INSERT INTO server_members (server_id, user_id, role) VALUES (?, ?, ?)',
              [defaultServer.id, userId, 'member'],
              (err) => {
                if (err) {
                  console.error('Failed to add user to default server:', err);
                }
              }
            );
          }
        });

        res.json({ token, user: { id: userId, email, username } });
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

// 获取服务器的频道列表
app.get('/api/servers/:serverId/channels', authenticateToken, (req, res) => {
  const serverId = req.params.serverId;
  const userId = req.user.userId;

  // 检查用户是否是服务器成员
  db.get(
    'SELECT * FROM server_members WHERE server_id = ? AND user_id = ?',
    [serverId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this server' });
      }

      db.all(`
        SELECT c.*, u.username as creator_name
        FROM channels c
        JOIN users u ON c.created_by = u.id
        WHERE c.server_id = ?
        ORDER BY c.created_at ASC
      `, [serverId], (err, channels) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(channels);
      });
    }
  );
});

// 保持向后兼容的频道API（获取所有频道，主要用于迁移期间）
app.get('/api/channels', authenticateToken, (req, res) => {
  db.all(`
    SELECT c.*, u.username as creator_name
    FROM channels c
    JOIN users u ON c.created_by = u.id
    WHERE c.server_id IS NULL
  `, (err, channels) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(channels);
  });
});

// 在服务器中创建频道
app.post('/api/servers/:serverId/channels', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const serverId = req.params.serverId;
  const userId = req.user.userId;

  // 检查用户是否是服务器成员且有权限创建频道
  db.get(
    'SELECT sm.role, s.owner_id FROM server_members sm JOIN servers s ON sm.server_id = s.id WHERE sm.server_id = ? AND sm.user_id = ?',
    [serverId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this server' });
      }

      // 只有管理员和所有者可以创建频道
      if (member.role !== 'admin' && member.owner_id !== userId) {
        return res.status(403).json({ error: 'Insufficient permissions to create channels' });
      }

      db.run(
        'INSERT INTO channels (name, description, created_by, server_id) VALUES (?, ?, ?, ?)',
        [name, description || '', userId, serverId],
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
              res.json({
                id: this.lastID,
                name,
                description,
                created_by: userId,
                server_id: serverId
              });
            }
          );
        }
      );
    }
  );
});

// 保持向后兼容的频道创建API（用于没有服务器的频道）
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

// 生成随机邀请码
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 获取用户的服务器列表
app.get('/api/servers', authenticateToken, (req, res) => {
  const userId = req.user.userId;

  db.all(`
    SELECT s.*, sm.role, sm.joined_at
    FROM servers s
    JOIN server_members sm ON s.id = sm.server_id
    WHERE sm.user_id = ?
    ORDER BY sm.joined_at ASC
  `, [userId], (err, servers) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(servers);
  });
});

// 创建服务器
app.post('/api/servers', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.userId;
  const inviteCode = generateInviteCode();

  db.run(
    'INSERT INTO servers (name, description, owner_id, invite_code) VALUES (?, ?, ?, ?)',
    [name, description || '', userId, inviteCode],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      const serverId = this.lastID;

      // 将创建者添加为服务器管理员
      db.run(
        'INSERT INTO server_members (server_id, user_id, role) VALUES (?, ?, ?)',
        [serverId, userId, 'admin'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.json({
            id: serverId,
            name,
            description,
            owner_id: userId,
            invite_code: inviteCode,
            role: 'admin'
          });
        }
      );
    }
  );
});

// 通过邀请码加入服务器
app.post('/api/servers/join/:inviteCode', authenticateToken, (req, res) => {
  const { inviteCode } = req.params;
  const userId = req.user.userId;

  // 查找服务器
  db.get('SELECT * FROM servers WHERE invite_code = ?', [inviteCode], (err, server) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!server) {
      return res.status(404).json({ error: 'Invalid invite code' });
    }

    // 检查是否已经是成员
    db.get(
      'SELECT * FROM server_members WHERE server_id = ? AND user_id = ?',
      [server.id, userId],
      (err, member) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (member) {
          return res.status(400).json({ error: 'Already a member of this server' });
        }

        // 添加为服务器成员
        db.run(
          'INSERT INTO server_members (server_id, user_id, role) VALUES (?, ?, ?)',
          [server.id, userId, 'member'],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({
              message: 'Successfully joined server',
              server: {
                id: server.id,
                name: server.name,
                description: server.description,
                role: 'member'
              }
            });
          }
        );
      }
    );
  });
});

// 获取服务器信息
app.get('/api/servers/:id', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  const userId = req.user.userId;

  // 检查用户是否是服务器成员
  db.get(
    'SELECT * FROM server_members WHERE server_id = ? AND user_id = ?',
    [serverId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!member) {
        return res.status(403).json({ error: 'Not a member of this server' });
      }

      // 获取服务器信息
      db.get('SELECT * FROM servers WHERE id = ?', [serverId], (err, server) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!server) {
          return res.status(404).json({ error: 'Server not found' });
        }

        res.json({
          ...server,
          role: member.role
        });
      });
    }
  );
});

// 生成新的邀请链接
app.post('/api/servers/:id/invite', authenticateToken, (req, res) => {
  const serverId = req.params.id;
  const userId = req.user.userId;

  // 检查用户是否有权限生成邀请链接（管理员或所有者）
  db.get(
    'SELECT sm.role, s.owner_id FROM server_members sm JOIN servers s ON sm.server_id = s.id WHERE sm.server_id = ? AND sm.user_id = ?',
    [serverId, userId],
    (err, member) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!member || (member.role !== 'admin' && member.owner_id !== userId)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const newInviteCode = generateInviteCode();

      db.run(
        'UPDATE servers SET invite_code = ? WHERE id = ?',
        [newInviteCode, serverId],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.json({ invite_code: newInviteCode });
        }
      );
    }
  );
});

const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('user-joined', (userData) => {
    connectedUsers.set(socket.id, userData);
    socket.broadcast.emit('user-online', userData);
  });

  socket.on('join-server', (serverId) => {
    socket.join(`server-${serverId}`);
    console.log(`User ${socket.id} joined server ${serverId}`);
  });

  socket.on('leave-server', (serverId) => {
    socket.leave(`server-${serverId}`);
    console.log(`User ${socket.id} left server ${serverId}`);
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