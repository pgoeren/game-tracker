const express = require('express');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('../db');
const router  = express.Router();

// Multer — store avatars in uploads/avatars/ (UPLOADS_DIR overrides for persistent volumes)
const avatarsDir = path.join(process.env.UPLOADS_DIR || path.join(__dirname, '..', 'uploads'), 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: avatarsDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `player-${req.params.id}-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed'));
    cb(null, true);
  },
});

function deleteAvatarFile(avatarUrl) {
  if (!avatarUrl) return;
  try {
    const filepath = path.join(avatarsDir, path.basename(avatarUrl));
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
  } catch (_) {}
}

router.get('/', (req, res, next) => {
  try {
    res.json(db.prepare('SELECT * FROM players ORDER BY name').all());
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const result = db.prepare('INSERT INTO players (name, color) VALUES (?, ?)').run(name.trim(), color || '#6366f1');
    res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const { name, color } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    db.prepare('UPDATE players SET name = ?, color = ? WHERE id = ?').run(name.trim(), color, req.params.id);
    res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
  } catch (e) { next(e); }
});

// Upload / replace avatar
router.post('/:id/avatar', upload.single('avatar'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    // Remove old avatar
    deleteAvatarFile(player.avatar_url);

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    db.prepare('UPDATE players SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.params.id);
    res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
  } catch (e) { next(e); }
});

// Remove avatar
router.delete('/:id/avatar', (req, res, next) => {
  try {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    deleteAvatarFile(player.avatar_url);
    db.prepare('UPDATE players SET avatar_url = NULL WHERE id = ?').run(req.params.id);
    res.json(db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id));
  } catch (e) { next(e); }
});

router.get('/:id/stats', (req, res, next) => {
  try {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (!player) return res.status(404).json({ error: 'Player not found' });

    const overall = db.prepare(`
      SELECT COUNT(*) as games_played,
        SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result='loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result='draw' THEN 1 ELSE 0 END) as draws,
        ROUND(100.0 * SUM(CASE WHEN result='win' THEN 1 ELSE 0 END) / MAX(COUNT(*),1), 1) as win_rate
      FROM session_players WHERE player_id = ?
    `).get(req.params.id);

    const gameBreakdown = db.prepare(`
      SELECT g.id as game_id, g.name as game_name, g.image_url,
        COUNT(*) as games_played,
        SUM(CASE WHEN sp.result='win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN sp.result='loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN sp.result='draw' THEN 1 ELSE 0 END) as draws,
        ROUND(100.0 * SUM(CASE WHEN sp.result='win' THEN 1 ELSE 0 END) / MAX(COUNT(*),1), 1) as win_rate
      FROM session_players sp
      JOIN sessions s ON sp.session_id = s.id
      JOIN games g ON s.game_id = g.id
      WHERE sp.player_id = ?
      GROUP BY g.id
      ORDER BY games_played DESC, wins DESC
    `).all(req.params.id);

    const recentSessions = db.prepare(`
      SELECT s.id, s.date, g.name as game_name, sp.result, sp.score
      FROM session_players sp
      JOIN sessions s ON sp.session_id = s.id
      JOIN games g ON s.game_id = g.id
      WHERE sp.player_id = ?
      ORDER BY s.date DESC, s.created_at DESC
      LIMIT 10
    `).all(req.params.id).map(s => {
      const others = db.prepare(`
        SELECT p.name, p.color, p.avatar_url, sp.result
        FROM session_players sp
        JOIN players p ON sp.player_id = p.id
        WHERE sp.session_id = ? AND sp.player_id != ?
      `).all(s.id, req.params.id);
      return { ...s, others };
    });

    res.json({ player, overall, gameBreakdown, recentSessions });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    if (player) deleteAvatarFile(player.avatar_url);
    db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
