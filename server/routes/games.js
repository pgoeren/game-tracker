const express = require('express');
const db = require('../db');
const router = express.Router();

async function fetchCoverImage(name) {
  // Try DuckDuckGo Instant Answer API first — no auth, no key needed
  try {
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(name + ' board game')}&format=json&no_redirect=1&no_html=1`;
    const res = await fetch(ddgUrl, { headers: { 'User-Agent': 'GameTracker/1.0' } });
    const data = await res.json();
    if (data.Image) {
      const img = data.Image.startsWith('/') ? 'https://duckduckgo.com' + data.Image : data.Image;
      return img;
    }
  } catch (_) {}

  // Fall back to Wikipedia page summary
  try {
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
    const res = await fetch(wikiUrl, { headers: { 'User-Agent': 'GameTracker/1.0' } });
    const data = await res.json();
    if (data.thumbnail?.source) return data.thumbnail.source;
  } catch (_) {}

  return null;
}

router.get('/', (req, res, next) => {
  try {
    const games = db.prepare('SELECT * FROM games ORDER BY name').all();
    res.json(games);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const existing = db.prepare('SELECT id FROM games WHERE LOWER(name) = LOWER(?)').get(name.trim());
    if (existing) return res.status(409).json({ error: `"${name.trim()}" is already in your library` });

    let result;
    try {
      result = db.prepare('INSERT INTO games (name) VALUES (?)').run(name.trim());
    } catch (e) {
      if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: `"${name.trim()}" is already in your library` });
      throw e;
    }
    const id = result.lastInsertRowid;

    try {
      const imageUrl = await fetchCoverImage(name.trim());
      if (imageUrl) db.prepare('UPDATE games SET image_url = ? WHERE id = ?').run(imageUrl, id);
    } catch (_) {}

    res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(id));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const existing = db.prepare('SELECT id FROM games WHERE LOWER(name) = LOWER(?) AND id != ?').get(name.trim(), req.params.id);
    if (existing) return res.status(409).json({ error: `"${name.trim()}" is already in your library` });

    db.prepare('UPDATE games SET name = ?, image_url = NULL WHERE id = ?').run(name.trim(), req.params.id);

    try {
      const imageUrl = await fetchCoverImage(name.trim());
      if (imageUrl) db.prepare('UPDATE games SET image_url = ? WHERE id = ?').run(imageUrl, req.params.id);
    } catch (_) {}

    res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id));
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Manual cover refresh
router.post('/:id/cover', async (req, res, next) => {
  try {
    const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });

    const imageUrl = await fetchCoverImage(game.name);
    if (!imageUrl) return res.status(404).json({ error: 'No cover art found' });

    db.prepare('UPDATE games SET image_url = ? WHERE id = ?').run(imageUrl, req.params.id);
    res.json({ ...game, image_url: imageUrl });
  } catch (e) { next(e); }
});

// Save a manually pasted image URL
router.put('/:id/cover', (req, res, next) => {
  try {
    const { image_url } = req.body;
    if (!image_url?.trim()) return res.status(400).json({ error: 'image_url is required' });
    db.prepare('UPDATE games SET image_url = ? WHERE id = ?').run(image_url.trim(), req.params.id);
    res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id));
  } catch (e) { next(e); }
});

module.exports = router;
