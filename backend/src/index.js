require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const { initSocket } = require('./socket/index');

const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(s => s.trim())
  : ['http://localhost:5173'];

const corsOptions = {
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // temporarily allow all during setup
  },
  credentials: true
};

app.use(cors(corsOptions));
const io = new Server(server, { cors: corsOptions });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/posts',         require('./routes/post.routes'));
app.use('/api/posts/:postId/comments', require('./routes/comment.routes'));
app.use('/api/messages',      require('./routes/message.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/stories',       require('./routes/story.routes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

initSocket(io);
app.set('io', io);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT, () => console.log(`🚀 Server on port ${process.env.PORT}`));
  })
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });
