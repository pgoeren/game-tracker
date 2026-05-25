const express = require('express');
const ExcelJS = require('exceljs');
const db = require('../db');
const router = express.Router();

const RESULT_LABEL = { win: '1st Place', loss: 'Last Place', draw: 'Non-win, Non-loss' };

const PURPLE = 'FF3D1F8F';
const WHITE  = 'FFFFFFFF';
const LIGHT  = 'FFF3F0FC';
const ACCENT = 'FFEF4444';

function headerRow(sheet, cols) {
  const row = sheet.addRow(cols.map(c => c.label));
  row.eachCell(cell => {
    cell.font = { bold: true, color: { argb: WHITE }, name: 'Arial', size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PURPLE } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'thin', color: { argb: PURPLE } } };
  });
  row.height = 22;
  sheet.columns = cols.map(c => ({ width: c.width || 16 }));
}

function dataRow(sheet, values, shade) {
  const row = sheet.addRow(values);
  row.eachCell(cell => {
    cell.font = { name: 'Arial', size: 10 };
    cell.alignment = { vertical: 'middle' };
    if (shade) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } };
  });
  row.height = 18;
  return row;
}

router.get('/', async (req, res, next) => {
  try {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'GameTracker';
    wb.created = new Date();

    // ── Pull data ──────────────────────────────────────────────────────────
    const players = db.prepare('SELECT * FROM players ORDER BY name').all();
    const games   = db.prepare('SELECT * FROM games ORDER BY name').all();
    const sessions = db.prepare(`
      SELECT s.*, g.name as game_name FROM sessions s
      JOIN games g ON s.game_id = g.id ORDER BY s.date DESC
    `).all().map(s => ({
      ...s,
      players: db.prepare(`
        SELECT sp.*, p.name as player_name FROM session_players sp
        JOIN players p ON sp.player_id = p.id WHERE sp.session_id = ?
      `).all(s.id),
    }));

    const playerStats = db.prepare(`
      SELECT p.id, p.name,
        COUNT(sp.id) as games_played,
        SUM(CASE WHEN sp.result='win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN sp.result='loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN sp.result='draw' THEN 1 ELSE 0 END) as draws,
        ROUND(100.0 * SUM(CASE WHEN sp.result='win' THEN 1 ELSE 0 END) / MAX(COUNT(sp.id),1), 1) as win_rate
      FROM players p LEFT JOIN session_players sp ON p.id = sp.player_id
      GROUP BY p.id ORDER BY wins DESC
    `).all();

    const gameStats = db.prepare(`
      SELECT g.id, g.name,
        COUNT(DISTINCT s.id) as times_played,
        COUNT(DISTINCT sp.player_id) as unique_players
      FROM games g
      LEFT JOIN sessions s ON g.id = s.game_id
      LEFT JOIN session_players sp ON s.id = sp.session_id
      GROUP BY g.id ORDER BY times_played DESC
    `).all();

    const favMap = {};
    db.prepare(`
      SELECT sp.player_id, g.name as game_name, COUNT(*) as cnt
      FROM session_players sp JOIN sessions s ON sp.session_id=s.id
      JOIN games g ON s.game_id=g.id GROUP BY sp.player_id, g.id
    `).all().forEach(r => {
      if (!favMap[r.player_id] || r.cnt > favMap[r.player_id].cnt) favMap[r.player_id] = r;
    });

    // ── Sheet 1: Summary ───────────────────────────────────────────────────
    const sum = wb.addWorksheet('Summary');
    const titleRow = sum.addRow(['🎲 Game Tracker — Export']);
    titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: PURPLE }, name: 'Arial' };
    titleRow.height = 30;
    sum.addRow(['Generated', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })]);
    sum.addRow([]);

    const statRows = [
      ['Total Sessions Logged', sessions.length],
      ['Total Players', players.length],
      ['Total Games in Library', games.length],
      ['Top Player (by wins)', playerStats[0] ? `${playerStats[0].name} — ${playerStats[0].wins} wins (${playerStats[0].win_rate}% win rate)` : '—'],
      ['Most Played Game', gameStats[0] ? `${gameStats[0].name} — ${gameStats[0].times_played} sessions` : '—'],
    ];
    statRows.forEach(([label, val], i) => {
      const r = sum.addRow([label, val]);
      r.getCell(1).font = { bold: true, name: 'Arial', size: 10 };
      r.getCell(2).font = { name: 'Arial', size: 10 };
      if (i % 2 === 0) r.eachCell(c => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }; });
    });
    sum.columns = [{ width: 26 }, { width: 46 }];

    // ── Sheet 2: Player Stats ──────────────────────────────────────────────
    const ps = wb.addWorksheet('Player Stats');
    headerRow(ps, [
      { label: 'Rank', width: 8 }, { label: 'Player', width: 18 },
      { label: 'Games Played', width: 14 }, { label: 'Wins', width: 10 },
      { label: 'Losses', width: 10 }, { label: 'Non-win, Non-loss', width: 20 },
      { label: 'Win Rate', width: 12 }, { label: 'Favorite Game', width: 22 },
    ]);
    playerStats.forEach((p, i) => {
      const row = dataRow(ps, [
        i + 1, p.name, p.games_played, p.wins, p.losses, p.draws,
        p.games_played > 0 ? p.win_rate / 100 : 0,
        favMap[p.id]?.game_name || '—',
      ], i % 2 === 1);
      row.getCell(7).numFmt = '0.0%';
      row.getCell(7).alignment = { horizontal: 'center' };
      [1,3,4,5,6].forEach(n => row.getCell(n).alignment = { horizontal: 'center' });
    });

    // ── Sheet 3: Game Stats ────────────────────────────────────────────────
    const gs = wb.addWorksheet('Game Stats');
    headerRow(gs, [
      { label: 'Rank', width: 8 }, { label: 'Game', width: 24 },
      { label: 'Sessions Played', width: 16 }, { label: 'Unique Players', width: 16 },
    ]);
    gameStats.forEach((g, i) => {
      const row = dataRow(gs, [i + 1, g.name, g.times_played, g.unique_players], i % 2 === 1);
      [1,3,4].forEach(n => row.getCell(n).alignment = { horizontal: 'center' });
    });

    // ── Sheet 4: Session History ───────────────────────────────────────────
    const sh = wb.addWorksheet('Session History');
    headerRow(sh, [
      { label: 'Date', width: 14 }, { label: 'Game', width: 22 },
      { label: 'Player', width: 16 }, { label: 'Result', width: 20 },
      { label: 'Score', width: 10 }, { label: 'Notes', width: 30 },
    ]);
    let rowIdx = 0;
    sessions.forEach(s => {
      s.players.forEach((p, i) => {
        const row = dataRow(sh, [
          s.date?.slice(0, 10) || '',
          i === 0 ? s.game_name : '',
          p.player_name,
          RESULT_LABEL[p.result] || p.result,
          p.score ?? '',
          i === 0 ? (s.notes || '') : '',
        ], rowIdx % 2 === 1);
        if (p.result === 'win') {
          row.getCell(4).font = { bold: true, color: { argb: 'FF16A34A' }, name: 'Arial', size: 10 };
        }
        rowIdx++;
      });
    });

    // ── Send file ──────────────────────────────────────────────────────────
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="GameTracker-${date}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (e) { next(e); }
});

module.exports = router;
