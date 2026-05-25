const path = require('path');
process.env.DB_PATH = process.env.DB_PATH || path.join(__dirname, 'db/game-tracker.db');
const db = require('./db');

const COLORS = ['#ef4444','#8b5cf6','#3b82f6','#f59e0b','#10b981','#ec4899','#6366f1','#14b8a6','#f97316','#06b6d4','#84cc16','#a855f7'];

function getOrCreatePlayer(name) {
  const n = name.trim();
  let p = db.prepare('SELECT * FROM players WHERE LOWER(name) = LOWER(?)').get(n);
  if (!p) {
    const count = db.prepare('SELECT COUNT(*) as c FROM players').get().c;
    const result = db.prepare('INSERT INTO players (name, color) VALUES (?, ?)').run(n, COLORS[count % COLORS.length]);
    p = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
    console.log(`  Created player: ${n}`);
  }
  return p;
}

function getOrCreateGame(name) {
  const n = name.trim();
  let g = db.prepare('SELECT * FROM games WHERE LOWER(name) = LOWER(?)').get(n);
  if (!g) {
    const result = db.prepare('INSERT INTO games (name) VALUES (?)').run(n);
    g = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
    console.log(`  Created game: ${n}`);
  }
  return g;
}

// winners and losers are arrays of names (trimmed, lowercase-compared)
const sessions = [
  { date: '2025-08-24', game: 'Cascadia',                    players: ['Ian','Gabby','Kelly','Hannah','Tracy'],               winners: ['Gabby'],         losers: ['Hannah'] },
  { date: '2025-08-16', game: 'Five Crowns',                  players: ['Ian','Gabby','Peter','Ashley','Eliese'],              winners: ['Gabby'],         losers: ['Peter'] },
  { date: '2025-09-12', game: 'Project L',                    players: ['Ian','Gabby','Nancy','Chuck'],                        winners: ['Gabby'],         losers: ['Chuck'] },
  { date: '2025-09-27', game: 'Cascadia Landmarks',           players: ['Ian','Gabby','Tracy','Hannah'],                       winners: ['Gabby'],         losers: ['Hannah'] },
  { date: '2025-10-02', game: 'Project L',                    players: ['Hannah','Tracy'],                                     winners: ['Tracy'],         losers: ['Hannah'] },
  { date: '2025-10-04', game: 'Splendor',                     players: ['Ian','Gabby'],                                        winners: ['Gabby'],         losers: ['Ian'] },
  { date: '2025-10-12', game: 'Lost Cities',                  players: ['Hannah','Tracy'],                                     winners: ['Tracy'],         losers: ['Hannah'] },
  { date: '2025-10-17', game: 'Firetower',                    players: ['Hannah','Tracy','Tai'],                               winners: ['Hannah','Tai'],  losers: ['Tracy'] },
  { date: '2025-11-01', game: 'Cascadia',                     players: ['Hannah','Tracy'],                                     winners: ['Tracy'],         losers: ['Hannah'] },
  { date: '2025-11-07', game: 'River Valley Glassworks',      players: ['Hannah','Tracy'],                                     winners: ['Hannah'],        losers: ['Tracy'] },
  { date: '2025-11-11', game: 'Splendor Duel',                players: ['Hannah','Tracy'],                                     winners: ['Tracy'],         losers: ['Hannah'] },
  { date: '2025-11-14', game: 'Wingspan',                     players: ['Ian','Gabby','Tracy','Hannah'],                       winners: ['Ian'],           losers: ['Hannah'] },
  { date: '2025-11-23', game: 'Project L',                    players: ['Ian','Gabby','Austin','GabbyGF'],                     winners: ['Ian'],           losers: ['Austin'] },
  { date: '2025-11-26', game: 'Project L',                    players: ['Ian','Gabby','Austin'],                               winners: ['Gabby'],         losers: ['Ian'] },
  { date: '2025-11-26', game: 'Project L',                    players: ['Ian','Gabby','Austin'],                               winners: ['Ian'],           losers: ['Austin'] },
  { date: '2025-11-29', game: '7 Wonders',                    players: ['Ian','Gabby','Ashley','Peter'],                       winners: ['Peter'],         losers: ['Gabby'] },
  { date: '2025-12-24', game: '7 Wonders',                    players: ['Ian','Gabby','Brandon'],                              winners: ['Gabby'],         losers: ['Ian'] },
  { date: '2025-12-25', game: 'What Do You Meme',             players: ['Ian','Gabby','Michael','Claire'],                     winners: ['Gabby'],         losers: ['Michael'] },
  { date: '2025-12-30', game: '7 Wonders',                    players: ['Ian','Gabby','Jessie','Heidi'],                       winners: ['Jessie'],        losers: ['Heidi'] }, // date was "2025-30-25" — corrected to 2025-12-30
  { date: '2026-01-17', game: 'King of Tokyo',                players: ['Ian','Gabby','Ashley','Peter'],                       winners: ['Gabby'],         losers: ['Ashley'] },
  { date: '2026-01-17', game: 'King of Tokyo',                players: ['Ian','Gabby','Ashley','Peter'],                       winners: ['Ashley'],        losers: ['Peter'] },
  { date: '2026-02-10', game: 'Sea, Salt & Paper',            players: ['Ian','Gabby'],                                        winners: ['Gabby'],         losers: ['Ian'] },
  { date: '2026-02-12', game: 'Sea, Salt & Paper',            players: ['Ian','Gabby'],                                        winners: ['Ian'],           losers: ['Gabby'] },
  { date: '2026-03-07', game: '7 Wonders',                    players: ['Ian','Gabby','Scott','Cara'],                         winners: ['Gabby'],         losers: ['Scott'] },
  { date: '2026-03-14', game: 'Wingspan',                     players: ['Ian','Gabby','Claire','Michael'],                     winners: ['Gabby'],         losers: ['Ian'] },
  { date: '2026-03-21', game: 'Cascadia',                     players: ['Ian','Gabby','Peter','Ashley'],                       winners: ['Peter'],         losers: ['Ashley'] },
  { date: '2026-04-04', game: 'Ticket to Ride - Europe',      players: ['Ian','Gabby','Peter','Ashley'],                       winners: ['Gabby'],         losers: ['Peter'] },
  { date: '2026-04-17', game: 'Taco Cat Goat Cheese Pizza',   players: ['Ian','Gabby','Cam','Tanner','Emily','Tracy','Hannah'], winners: ['Cam'],           losers: ['Ian','Gabby','Tanner','Emily','Tracy','Hannah'] },
  { date: '2026-04-29', game: '7 Wonders',                    players: ['Ian','Gabby','Scott','Cara'],                         winners: ['Cara'],          losers: ['Ian'] },
  { date: '2026-05-05', game: 'Sea, Salt & Paper',            players: ['Ian','Gabby'],                                        winners: ['Gabby'],         losers: ['Ian'] },
  { date: '2026-05-10', game: 'Project L',                    players: ['Ian','Gabby','Karen','Rich'],                         winners: ['Gabby'],         losers: ['Ian'] },
];

let added = 0, failed = 0;

for (const s of sessions) {
  console.log(`\n${s.date} — ${s.game}`);
  db.exec('BEGIN');
  try {
    const game = getOrCreateGame(s.game);
    const sessionResult = db.prepare('INSERT INTO sessions (game_id, date) VALUES (?, ?)').run(game.id, s.date);
    const sessionId = sessionResult.lastInsertRowid;

    for (const playerName of s.players) {
      const player = getOrCreatePlayer(playerName);
      const wl = s.winners.map(w => w.trim().toLowerCase());
      const ll = s.losers.map(l => l.trim().toLowerCase());
      const pn = playerName.trim().toLowerCase();
      const result = wl.includes(pn) ? 'win' : ll.includes(pn) ? 'loss' : 'draw';
      db.prepare('INSERT INTO session_players (session_id, player_id, result) VALUES (?, ?, ?)').run(sessionId, player.id, result);
    }

    db.exec('COMMIT');
    console.log(`  ✓ Added`);
    added++;
  } catch (e) {
    db.exec('ROLLBACK');
    console.error(`  ✗ Failed: ${e.message}`);
    failed++;
  }
}

console.log(`\nDone. ${added} sessions added, ${failed} failed.`);
