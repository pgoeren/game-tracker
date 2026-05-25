const express = require('express');
const db = require('../db');
const router = express.Router();

router.get('/', (req, res, next) => {
  try {
    const sessions = db.prepare(`
      SELECT s.*, g.name as game_name
      FROM sessions s
      JOIN games g ON s.game_id = g.id
      ORDER BY s.date DESC, s.created_at DESC
    `).all();

    const result = sessions.map(session => {
      const players = db.prepare(`
        SELECT sp.*, p.name as player_name, p.color as player_color
        FROM session_players sp
        JOIN players p ON sp.player_id = p.id
        WHERE sp.session_id = ?
      `).all(session.id);
      return { ...session, players };
    });

    res.json(result);
  } catch (e) { next(e); }
});

router.post('/', (req, res, next) => {
  try {
    const { game_id, date, notes, players } = req.body;
    if (!game_id || !date || !players?.length) {
      return res.status(400).json({ error: 'game_id, date, and players are required' });
    }

    db.exec('BEGIN');
    let sessionId;
    try {
      const result = db.prepare('INSERT INTO sessions (game_id, date, notes) VALUES (?, ?, ?)').run(game_id, date, notes || null);
      sessionId = result.lastInsertRowid;
      for (const p of players) {
        db.prepare('INSERT INTO session_players (session_id, player_id, result, score) VALUES (?, ?, ?, ?)').run(sessionId, p.player_id, p.result, p.score ?? null);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    const session = db.prepare('SELECT s.*, g.name as game_name FROM sessions s JOIN games g ON s.game_id = g.id WHERE s.id = ?').get(sessionId);
    const sessionPlayers = db.prepare('SELECT sp.*, p.name as player_name, p.color as player_color FROM session_players sp JOIN players p ON sp.player_id = p.id WHERE sp.session_id = ?').all(sessionId);
    res.json({ ...session, players: sessionPlayers });
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  try {
    const { game_id, date, notes, players } = req.body;
    if (!game_id || !date || !players?.length) {
      return res.status(400).json({ error: 'game_id, date, and players are required' });
    }

    db.exec('BEGIN');
    try {
      db.prepare('UPDATE sessions SET game_id = ?, date = ?, notes = ? WHERE id = ?').run(game_id, date, notes || null, req.params.id);
      db.prepare('DELETE FROM session_players WHERE session_id = ?').run(req.params.id);
      for (const p of players) {
        db.prepare('INSERT INTO session_players (session_id, player_id, result, score) VALUES (?, ?, ?, ?)').run(req.params.id, p.player_id, p.result, p.score ?? null);
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }

    const session = db.prepare('SELECT s.*, g.name as game_name FROM sessions s JOIN games g ON s.game_id = g.id WHERE s.id = ?').get(req.params.id);
    const sessionPlayers = db.prepare('SELECT sp.*, p.name as player_name, p.color as player_color FROM session_players sp JOIN players p ON sp.player_id = p.id WHERE sp.session_id = ?').all(req.params.id);
    res.json({ ...session, players: sessionPlayers });
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/faceoff', (req, res, next) => {
  try {
    const { p1, p2, game } = req.query;
    if (!p1 || !p2) return res.status(400).json({ error: 'p1 and p2 are required' });

    const player1 = db.prepare('SELECT * FROM players WHERE id = ?').get(p1);
    const player2 = db.prepare('SELECT * FROM players WHERE id = ?').get(p2);
    if (!player1 || !player2) return res.status(404).json({ error: 'Player not found' });

    // Head-to-head sessions where both players participated
    const h2hSessions = game
      ? db.prepare(`
          SELECT s.id, s.date, g.name as game_name,
            sp1.result as p1_result, sp2.result as p2_result
          FROM sessions s
          JOIN games g ON s.game_id = g.id
          JOIN session_players sp1 ON s.id = sp1.session_id AND sp1.player_id = ?
          JOIN session_players sp2 ON s.id = sp2.session_id AND sp2.player_id = ?
          WHERE s.game_id = ?
          ORDER BY s.date DESC
        `).all(p1, p2, game)
      : db.prepare(`
          SELECT s.id, s.date, g.name as game_name,
            sp1.result as p1_result, sp2.result as p2_result
          FROM sessions s
          JOIN games g ON s.game_id = g.id
          JOIN session_players sp1 ON s.id = sp1.session_id AND sp1.player_id = ?
          JOIN session_players sp2 ON s.id = sp2.session_id AND sp2.player_id = ?
          ORDER BY s.date DESC
        `).all(p1, p2);

    const h2h_total = h2hSessions.length;
    const p1_wins  = h2hSessions.filter(s => s.p1_result === 'win').length;
    const p2_wins  = h2hSessions.filter(s => s.p2_result === 'win').length;
    const draws    = h2hSessions.filter(s => s.p1_result === 'draw').length;

    // Overall stats per player (filtered by game if provided)
    function overallStats(playerId) {
      return game
        ? db.prepare(`
            SELECT COUNT(*) as games_played,
              SUM(CASE WHEN sp.result = 'win'  THEN 1 ELSE 0 END) as wins,
              SUM(CASE WHEN sp.result = 'loss' THEN 1 ELSE 0 END) as losses,
              SUM(CASE WHEN sp.result = 'draw' THEN 1 ELSE 0 END) as draws,
              ROUND(100.0 * SUM(CASE WHEN sp.result = 'win' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) as win_rate
            FROM session_players sp
            JOIN sessions s ON sp.session_id = s.id
            WHERE sp.player_id = ? AND s.game_id = ?
          `).get(playerId, game)
        : db.prepare(`
            SELECT COUNT(*) as games_played,
              SUM(CASE WHEN sp.result = 'win'  THEN 1 ELSE 0 END) as wins,
              SUM(CASE WHEN sp.result = 'loss' THEN 1 ELSE 0 END) as losses,
              SUM(CASE WHEN sp.result = 'draw' THEN 1 ELSE 0 END) as draws,
              ROUND(100.0 * SUM(CASE WHEN sp.result = 'win' THEN 1 ELSE 0 END) / MAX(COUNT(*), 1), 1) as win_rate
            FROM session_players sp
            WHERE sp.player_id = ?
          `).get(playerId);
    }

    const p1_overall = overallStats(p1);
    const p2_overall = overallStats(p2);

    // Probability blending: H2H record weighted more heavily as sample size grows
    // weight approaches 0.85 at 15+ H2H games; below that overall win rate fills the gap
    const weight = Math.min(h2h_total / 15, 0.85);
    const h2h_decisive = p1_wins + p2_wins;
    const p1_h2h_rate = h2h_decisive > 0 ? (p1_wins / h2h_decisive) * 100 : 50;

    // Normalise overall win rates so they sum to 100 (relative strength)
    const totalRate = (p1_overall.win_rate || 0) + (p2_overall.win_rate || 0);
    const p1_rel = totalRate > 0 ? ((p1_overall.win_rate || 0) / totalRate) * 100 : 50;

    const p1_prob = Math.round(h2h_total > 0
      ? p1_h2h_rate * weight + p1_rel * (1 - weight)
      : p1_rel);
    const p2_prob = 100 - p1_prob;

    const confidence = h2h_total === 0 ? 'low'
      : h2h_total < 5 ? 'medium'
      : 'high';

    res.json({
      player1: { ...player1, overall: p1_overall },
      player2: { ...player2, overall: p2_overall },
      h2h: { total: h2h_total, p1_wins, p2_wins, draws },
      probability: { p1: p1_prob, p2: p2_prob },
      confidence,
      recentSessions: h2hSessions.slice(0, 6),
    });
  } catch (e) { next(e); }
});

router.get('/stats', (req, res, next) => {
  try {
    const playerStats = db.prepare(`
      SELECT
        p.id, p.name, p.color, p.avatar_url,
        COUNT(sp.id) as games_played,
        SUM(CASE WHEN sp.result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN sp.result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN sp.result = 'draw' THEN 1 ELSE 0 END) as draws,
        ROUND(100.0 * SUM(CASE WHEN sp.result = 'win' THEN 1 ELSE 0 END) / MAX(COUNT(sp.id), 1), 1) as win_rate
      FROM players p
      LEFT JOIN session_players sp ON p.id = sp.player_id
      GROUP BY p.id
    `).all().map(p => ({
      ...p,
      // weighted score: win_rate × √games_played — rewards both a high win% and more games played
      weighted_score: p.win_rate * Math.sqrt(p.games_played),
    })).sort((a, b) => b.weighted_score - a.weighted_score);

    const gameStats = db.prepare(`
      SELECT
        g.id, g.name,
        COUNT(DISTINCT s.id) as times_played,
        COUNT(DISTINCT sp.player_id) as unique_players
      FROM games g
      LEFT JOIN sessions s ON g.id = s.game_id
      LEFT JOIN session_players sp ON s.id = sp.session_id
      GROUP BY g.id
      ORDER BY times_played DESC
    `).all();

    const recentSessions = db.prepare(`
      SELECT s.id, s.date, s.notes, g.name as game_name, g.image_url as game_image_url
      FROM sessions s
      JOIN games g ON s.game_id = g.id
      ORDER BY s.date DESC, s.created_at DESC
      LIMIT 6
    `).all().map(session => {
      const players = db.prepare(`
        SELECT sp.result, p.name as player_name, p.color as player_color, p.avatar_url
        FROM session_players sp
        JOIN players p ON sp.player_id = p.id
        WHERE sp.session_id = ?
      `).all(session.id);
      return { ...session, players };
    });

    const favoriteGamePerPlayer = db.prepare(`
      SELECT sp.player_id, g.name as game_name, COUNT(*) as cnt
      FROM session_players sp
      JOIN sessions s ON sp.session_id = s.id
      JOIN games g ON s.game_id = g.id
      GROUP BY sp.player_id, g.id
    `).all();

    const favMap = {};
    for (const row of favoriteGamePerPlayer) {
      if (!favMap[row.player_id] || row.cnt > favMap[row.player_id].cnt) {
        favMap[row.player_id] = row;
      }
    }

    const enrichedPlayerStats = playerStats.map(p => ({
      ...p,
      favorite_game: favMap[p.id]?.game_name || null,
    }));

    // Per-game player breakdown — best (most wins) and worst (most losses)
    const perGamePlayerStats = db.prepare(`
      SELECT
        g.id as game_id, g.name as game_name,
        p.id as player_id, p.name as player_name, p.color as player_color, p.avatar_url,
        COUNT(sp.id) as games_played,
        SUM(CASE WHEN sp.result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN sp.result = 'loss' THEN 1 ELSE 0 END) as losses,
        ROUND(100.0 * SUM(CASE WHEN sp.result = 'win' THEN 1 ELSE 0 END) / MAX(COUNT(sp.id), 1), 1) as win_rate,
        ROUND(100.0 * SUM(CASE WHEN sp.result = 'loss' THEN 1 ELSE 0 END) / MAX(COUNT(sp.id), 1), 1) as loss_rate
      FROM games g
      JOIN sessions s ON g.id = s.game_id
      JOIN session_players sp ON s.id = sp.session_id
      JOIN players p ON sp.player_id = p.id
      GROUP BY g.id, p.id
      HAVING games_played >= 1
    `).all();

    // Group by game, pick best (highest win_rate) and worst (highest loss_rate) per game
    const gameLeaderboard = {};
    for (const row of perGamePlayerStats) {
      if (!gameLeaderboard[row.game_id]) {
        gameLeaderboard[row.game_id] = { game_id: row.game_id, game_name: row.game_name, players: [] };
      }
      gameLeaderboard[row.game_id].players.push(row);
    }

    const gameLeaderboardArr = Object.values(gameLeaderboard)
      .filter(g => g.players.length > 0)
      .map(g => {
        // Best = most wins for this game; tiebreak by win rate (wins ÷ games played)
        const sorted = [...g.players].sort((a, b) => b.wins - a.wins || b.win_rate - a.win_rate);
        // Worst = most losses for this game; tiebreak by loss rate (losses ÷ games played)
        const sortedLoss = [...g.players].sort((a, b) => b.losses - a.losses || b.loss_rate - a.loss_rate);
        const best = sorted[0];
        const worst = sortedLoss.find(p => p.player_id !== best?.player_id) || null;
        return {
          game_id: g.game_id,
          game_name: g.game_name,
          best,
          worst,
          players: sorted,
        };
      })
      .filter(g => g.players.length >= 1)
      .sort((a, b) => b.players.reduce((s, p) => s + p.games_played, 0) - a.players.reduce((s, p) => s + p.games_played, 0));

    // Overall win/loss rates across all session_players
    const totals = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as total_wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as total_losses
      FROM session_players
    `).get();

    res.json({ playerStats: enrichedPlayerStats, gameStats, recentSessions, gameLeaderboard: gameLeaderboardArr, totals });
  } catch (e) { next(e); }
});

module.exports = router;
