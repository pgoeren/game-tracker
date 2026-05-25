import * as XLSX from 'xlsx';

const RESULT_LABEL = { win: '1st Place', loss: 'Last Place', draw: 'Non-win, Non-loss' };

function colWidth(arr, key, min = 10, max = 40) {
  const longest = arr.reduce((acc, row) => Math.max(acc, String(row[key] ?? '').length), String(key).length);
  return Math.min(Math.max(longest + 2, min), max);
}

function makeSheet(rows, cols) {
  const header = cols.map(c => c.label);
  const data = rows.map(row => cols.map(c => row[c.key] ?? ''));
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);

  // Column widths
  ws['!cols'] = cols.map(c => ({
    wch: colWidth(rows, c.key, c.min || 10, c.max || 40),
  }));

  return ws;
}

export async function exportToExcel() {
  // Fetch everything in parallel
  const [sessions, players, games, stats] = await Promise.all([
    fetch('/api/sessions').then(r => r.json()),
    fetch('/api/players').then(r => r.json()),
    fetch('/api/games').then(r => r.json()),
    fetch('/api/sessions/stats').then(r => r.json()),
  ]);

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Player Stats ───────────────────────────────────────────────
  const playerRows = stats.playerStats.map((p, i) => ({
    rank: i + 1,
    name: p.name,
    games_played: p.games_played,
    wins: p.wins,
    losses: p.losses,
    draws: p.draws,
    win_rate: p.games_played > 0 ? (p.win_rate / 100) : '',
    favorite_game: p.favorite_game || '—',
  }));

  const playerSheet = makeSheet(playerRows, [
    { key: 'rank',         label: 'Rank' },
    { key: 'name',         label: 'Player',        min: 14 },
    { key: 'games_played', label: 'Games Played' },
    { key: 'wins',         label: 'Wins' },
    { key: 'losses',       label: 'Losses' },
    { key: 'draws',        label: 'Non-win, Non-loss' },
    { key: 'win_rate',     label: 'Win Rate' },
    { key: 'favorite_game',label: 'Favorite Game', min: 16 },
  ]);

  // Format win rate column as percentage
  const pctCol = 'G'; // win_rate is column G (0-indexed 6 → G)
  for (let r = 2; r <= playerRows.length + 1; r++) {
    const cell = playerSheet[`${pctCol}${r}`];
    if (cell && typeof cell.v === 'number') {
      cell.z = '0.0%';
    }
  }

  XLSX.utils.book_append_sheet(wb, playerSheet, 'Player Stats');

  // ── Sheet 2: Game Stats ─────────────────────────────────────────────────
  const gameRows = stats.gameStats.map((g, i) => ({
    rank: i + 1,
    name: g.name,
    times_played: g.times_played,
    unique_players: g.unique_players,
  }));

  XLSX.utils.book_append_sheet(wb, makeSheet(gameRows, [
    { key: 'rank',           label: 'Rank' },
    { key: 'name',           label: 'Game',           min: 16 },
    { key: 'times_played',   label: 'Sessions Played' },
    { key: 'unique_players', label: 'Unique Players' },
  ]), 'Game Stats');

  // ── Sheet 3: Session History ────────────────────────────────────────────
  const sessionRows = sessions.flatMap(s => {
    if (s.players.length === 0) return [];
    return s.players.map((p, i) => ({
      date: s.date?.slice(0, 10) || '',
      game: s.game_name,
      player: p.player_name,
      result: RESULT_LABEL[p.result] || p.result,
      score: p.score ?? '',
      notes: i === 0 ? (s.notes || '') : '',
    }));
  });

  XLSX.utils.book_append_sheet(wb, makeSheet(sessionRows, [
    { key: 'date',   label: 'Date',   min: 12 },
    { key: 'game',   label: 'Game',   min: 16 },
    { key: 'player', label: 'Player', min: 14 },
    { key: 'result', label: 'Result', min: 18 },
    { key: 'score',  label: 'Score' },
    { key: 'notes',  label: 'Notes',  min: 20, max: 50 },
  ]), 'Sessions');

  // ── Sheet 4: Summary ────────────────────────────────────────────────────
  const totalSessions = stats.gameStats.reduce((s, g) => s + g.times_played, 0);
  const topPlayer = stats.playerStats[0];
  const topGame = stats.gameStats[0];

  const summaryData = [
    ['Game Tracker — Export Summary'],
    ['Generated', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })],
    [],
    ['Stat', 'Value'],
    ['Total Sessions Logged', totalSessions],
    ['Total Players', players.length],
    ['Total Games in Library', games.length],
    ['Top Player (by wins)', topPlayer ? `${topPlayer.name} (${topPlayer.wins} wins, ${topPlayer.win_rate}% win rate)` : '—'],
    ['Most Played Game', topGame ? `${topGame.name} (${topGame.times_played} sessions)` : '—'],
    [],
    ['Players', ...players.map(p => p.name)],
    ['Games', ...games.map(g => g.name)],
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  summarySheet['!cols'] = [{ wch: 28 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

  // ── Download ────────────────────────────────────────────────────────────
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `GameTracker-Export-${date}.xlsx`);
}
