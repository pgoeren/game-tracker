const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();

// Ensure uploads directory exists (override with UPLOADS_DIR to point at a persistent volume)
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors());
app.use(express.json());

// Serve uploaded files (avatars, etc.)
app.use('/uploads', express.static(uploadsDir));

app.use('/api/players', require('./routes/players'));
app.use('/api/games', require('./routes/games'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/export', require('./routes/export'));

// Serve built React app
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Game Tracker API running on port ${PORT}`));
