import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useApi';
import { Trophy, Gamepad2, ClipboardList, Flame, Download, ChevronDown, ChevronUp, Users } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';

const COLORS = ['#ef4444','#8b5cf6','#3b82f6','#f59e0b','#10b981','#ec4899','#6366f1','#14b8a6'];

function WinRateBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg, #8b5cf6, #ef4444)' }} />
      </div>
      <span className="text-[10px] font-semibold text-gray-500 w-8 text-right">{value}%</span>
    </div>
  );
}

function Podium({ players }) {
  if (players.length === 0) return null;
  const top = players.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  const blockHeights = { 0: 170, 1: 125, 2: 88 };
  const medals = { 0: '🥇', 1: '🥈', 2: '🥉' };
  const labels = { 0: '1st', 1: '2nd', 2: '3rd' };
  const glows  = { 0: 'shadow-md shadow-amber-200' };

  return (
    <div className="card flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Rankings</p>
          <h3 className="text-sm font-bold text-gray-800">Player Podium</h3>
        </div>
        <Trophy size={15} className="text-amber-500" />
      </div>
      <div className="flex-1 flex items-end gap-2">
        {order.map((p, visualIdx) => {
          const dataIdx = visualIdx === 0 ? 1 : visualIdx === 1 ? 0 : 2;
          return (
            <div key={p.id} className="flex-1 flex flex-col items-center gap-0.5">
              <PlayerAvatar player={p} className={`w-10 h-10 rounded-full text-base border-2 border-white ${glows[dataIdx] || ''}`} />
              <div className="text-base leading-none">{medals[dataIdx]}</div>
              <p className="font-bold text-gray-800 text-[11px] text-center leading-tight truncate w-full px-1">{p.name}</p>
              <p className="text-[9px] text-gray-400">{p.wins}W · {p.win_rate}%</p>
              <div className="w-full rounded-t-lg flex items-center justify-center font-bold text-white text-xs"
                style={{
                  height: blockHeights[dataIdx],
                  background: dataIdx === 0
                    ? 'linear-gradient(180deg,#f59e0b,#d97706)'
                    : dataIdx === 1
                    ? 'linear-gradient(180deg,#9ca3af,#6b7280)'
                    : 'linear-gradient(180deg,#cd7c2f,#a16207)',
                }}>
                {labels[dataIdx]}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading } = useFetch('/sessions/stats');
  const [exporting, setExporting] = useState(false);
  const [gamesExpanded, setGamesExpanded] = useState(false);
  const [playersExpanded, setPlayersExpanded] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `GameTracker-${new Date().toISOString().slice(0,10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading stats…</div>
      </div>
    );
  }

  if (!data) return null;

  const { playerStats, gameStats, recentSessions, gameLeaderboard } = data;
  const totalSessions = gameStats.reduce((s, g) => s + g.times_played, 0);
  const topPlayer = playerStats[0];
  const uniqueGames = gameStats.filter(g => g.times_played > 0).length;

  const gamePieData = gameStats
    .filter(g => g.times_played > 0)
    .map(g => ({ name: g.name, value: g.times_played }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-4 md:p-6 space-y-3 md:space-y-4">

      {/* Recent Sessions — thin full-width bar */}
      <div className="card py-2.5 px-3 md:px-4 flex items-center gap-2 md:gap-3">
        <div className="flex items-center gap-1.5 shrink-0">
          <Flame size={12} className="text-orange-400" />
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide hidden sm:block">Recent</span>
        </div>
        <div className="flex-1 flex items-center overflow-x-auto gap-0 scrollbar-hide">
          {recentSessions.length === 0 ? (
            <p className="text-xs text-gray-400">No sessions yet</p>
          ) : recentSessions.slice(0, 5).map((s, i) => {
            const winner = s.players.find(p => p.result === 'win');
            return (
              <div key={s.id} className={`flex items-center gap-2 min-w-[130px] md:flex-1 px-3 ${i > 0 ? 'border-l border-gray-100' : ''}`}>
                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 border border-gray-100">
                  {s.game_image_url
                    ? <img src={s.game_image_url} alt={s.game_name} className="w-full h-full object-cover" />
                    : <Gamepad2 size={13} className="text-gray-300" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{s.game_name}</p>
                  <p className="text-[10px] text-gray-400 truncate">
                    {winner ? `🥇 ${winner.player_name.split(' ')[0]}` : '—'} · {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <Link to="/sessions" className="text-[10px] font-semibold text-purple-500 hover:text-purple-700 transition-colors shrink-0">
          More →
        </Link>
      </div>

      {/* Stat chips + export */}
      <div className="grid grid-cols-2 md:flex gap-3">
        {[
          { label: 'Sessions',   value: totalSessions,          color: '#8b5cf6' },
          { label: 'Games',      value: uniqueGames,            color: '#3b82f6' },
          { label: 'Players',    value: playerStats.length,     color: '#10b981' },
          { label: 'Top Player', value: topPlayer?.name || '—', color: '#f59e0b', small: !!topPlayer },
        ].map(s => (
          <div key={s.label} className="card md:flex-1 py-2.5 px-3 flex items-center gap-2.5">
            <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className={`font-bold text-gray-800 truncate leading-tight ${s.small ? 'text-sm' : 'text-xl'}`}>{s.value}</p>
            </div>
          </div>
        ))}
        <button onClick={handleExport} disabled={exporting}
          className="card col-span-2 md:col-span-1 md:shrink-0 py-2.5 px-4 flex items-center justify-center gap-2 text-gray-400 hover:text-purple-600 transition-colors border border-transparent hover:border-purple-200">
          <Download size={13} />
          <span className="text-xs font-medium">{exporting ? 'Exporting…' : 'Export'}</span>
        </button>
      </div>

      {/* Podium + Player Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {playerStats?.length > 0 && <Podium players={playerStats} />}

        {/* Player Stats */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Overview</p>
              <h3 className="text-sm font-bold text-gray-800">Player Stats</h3>
            </div>
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <ClipboardList size={10} /> {totalSessions} sessions
            </span>
          </div>
          <div className="flex-1 space-y-0.5">
            {playerStats.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">No players yet</p>
            ) : playerStats.slice(0, 5).map((p, i) => (
              <Link key={p.id} to={`/players/${p.id}`}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="relative shrink-0">
                  <PlayerAvatar player={p} className="w-7 h-7 rounded-full text-xs" />
                  {i < 3 && (
                    <span className="absolute -top-1 -right-1 text-[9px] leading-none">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs truncate">{p.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider shrink-0">Win Rate</span>
                    <div className="flex-1 min-w-0"><WinRateBar value={p.win_rate || 0} /></div>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 text-[9px] font-semibold">
                  <span className="w-6 text-center py-0.5 rounded bg-purple-50 text-purple-600">{p.wins}W</span>
                  <span className="w-6 text-center py-0.5 rounded bg-red-50 text-red-500">{p.losses}L</span>
                  <span className="w-6 text-center py-0.5 rounded bg-gray-100 text-gray-400">{p.games_played}</span>
                </div>
              </Link>
            ))}
          </div>
          {playerStats.length > 5 && (
            <Link to="/leaderboard"
              className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors">
              View all {playerStats.length} players →
            </Link>
          )}
        </div>
      </div>

      {/* Bottom three panels */}
      {totalSessions === 0 ? (
        <div className="card text-center py-14">
          <Gamepad2 size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 font-medium">No sessions recorded yet</p>
          <p className="text-gray-300 text-sm mt-1">Add players, games, then log your first session</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* LEFT — Most Games Played (players) */}
          {playerStats.length > 0 && (() => {
            const sorted = [...playerStats].sort((a, b) => b.games_played - a.games_played);
            const max = sorted[0]?.games_played || 1;
            const SHOW = 5;
            const visible = playersExpanded ? sorted : sorted.slice(0, SHOW);
            const extra = sorted.length - SHOW;
            return (
              <div className="card flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Participation</p>
                    <h3 className="text-sm font-bold text-gray-800">Most Games Played</h3>
                  </div>
                  <Users size={15} className="text-purple-500" />
                </div>
                <div className="space-y-2 flex-1">
                  {visible.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-300 w-4 text-right shrink-0">{i + 1}</span>
                      <PlayerAvatar player={p} className="w-6 h-6 rounded-full text-[10px] shrink-0" />
                      <span className="text-xs font-semibold text-gray-700 w-20 truncate shrink-0">{p.name}</span>
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${(p.games_played / max) * 100}%`, backgroundColor: p.color }} />
                      </div>
                      <span className="text-xs font-bold text-gray-500 w-6 text-right shrink-0">{p.games_played}</span>
                    </div>
                  ))}
                </div>
                {extra > 0 && (
                  <button onClick={() => setPlayersExpanded(e => !e)}
                    className="mt-3 pt-3 border-t border-gray-100 w-full flex items-center justify-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors">
                    {playersExpanded ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show {extra} more</>}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Most Played Games */}
          {gamePieData.length > 0 && (() => {
            const visible = gamesExpanded ? gamePieData : gamePieData.slice(0, 5);
            const extra = gamePieData.length - 5;
            return (
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Game Popularity</p>
                    <h3 className="text-sm font-bold text-gray-800">Most Played</h3>
                  </div>
                  <Gamepad2 size={15} className="text-red-500" />
                </div>

                <div className="space-y-0.5">
                  {visible.map((g, i) => {
                    const pct = Math.round((g.value / gamePieData[0].value) * 100);
                    const isOpen = selectedGame === g.name;
                    const leaderData = gameLeaderboard?.find(gl => gl.game_name === g.name);
                    return (
                      <div key={g.name}>
                        <button
                          onClick={() => setSelectedGame(isOpen ? null : g.name)}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-left transition-colors ${isOpen ? 'bg-purple-50' : 'hover:bg-gray-50'}`}>
                          <span className="text-[10px] font-bold text-gray-400 w-4 text-right shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className={`text-xs font-semibold truncate ${isOpen ? 'text-purple-700' : 'text-gray-800'}`}>{g.name}</span>
                              <span className="text-[10px] font-bold text-gray-400 ml-2 shrink-0">{g.value}×</span>
                            </div>
                            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                          </div>
                          <ChevronDown size={12} className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-purple-500' : ''}`} />
                        </button>

                        {isOpen && leaderData && (
                          <div className="mx-2 mb-1.5 p-3 bg-purple-50 rounded-xl border border-purple-100 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              {leaderData.best && (
                                <div className="bg-white rounded-lg p-2.5">
                                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">🥇 Best</p>
                                  <div className="flex items-center gap-1.5">
                                    <PlayerAvatar player={{ name: leaderData.best.player_name, color: leaderData.best.player_color, avatar_url: leaderData.best.avatar_url }} className="w-6 h-6 rounded-full text-[10px]" />
                                    <div>
                                      <p className="font-semibold text-gray-800 text-xs">{leaderData.best.player_name}</p>
                                      <p className="text-[9px] text-emerald-600 font-semibold">{leaderData.best.wins}W / {leaderData.best.games_played}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {leaderData.worst && (
                                <div className="bg-white rounded-lg p-2.5">
                                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1">💀 Worst</p>
                                  <div className="flex items-center gap-1.5">
                                    <PlayerAvatar player={{ name: leaderData.worst.player_name, color: leaderData.worst.player_color, avatar_url: leaderData.worst.avatar_url }} className="w-6 h-6 rounded-full text-[10px]" />
                                    <div>
                                      <p className="font-semibold text-gray-800 text-xs">{leaderData.worst.player_name}</p>
                                      <p className="text-[9px] text-red-500 font-semibold">{leaderData.worst.losses}L / {leaderData.worst.games_played}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">All Players</p>
                              <div className="space-y-1">
                                {leaderData.players.map(p => (
                                  <div key={p.player_id} className="flex items-center gap-1.5">
                                    <PlayerAvatar player={{ name: p.player_name, color: p.player_color, avatar_url: p.avatar_url }} className="w-4 h-4 rounded-full text-[8px]" />
                                    <span className="text-xs font-medium text-gray-700 flex-1 truncate">{p.player_name}</span>
                                    <span className="text-[10px] text-purple-600 font-semibold">{p.wins}W</span>
                                    <span className="text-[10px] text-red-500 font-semibold">{p.losses}L</span>
                                    <span className="text-[10px] text-gray-400">{p.games_played}G</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {extra > 0 && (
                  <button
                    onClick={() => setGamesExpanded(e => !e)}
                    className="mt-2 pt-2 border-t border-gray-100 w-full flex items-center justify-center gap-1 text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors">
                    {gamesExpanded
                      ? <><ChevronUp size={12} /> Show less</>
                      : <><ChevronDown size={12} /> Show {extra} more</>}
                  </button>
                )}
              </div>
            );
          })()}

          {/* Best & Worst Per Game */}
          {gameLeaderboard?.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">By Game</p>
                  <h3 className="text-sm font-bold text-gray-800">Best & Worst Per Game</h3>
                </div>
                <Gamepad2 size={15} className="text-blue-500" />
              </div>
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-[10px] uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 font-semibold text-left">Game</th>
                    <th className="pb-2 font-semibold text-left">🥇 Best</th>
                    <th className="pb-2 font-semibold text-center">W/P</th>
                    <th className="pb-2 font-semibold text-left">💀 Worst</th>
                    <th className="pb-2 font-semibold text-center">L/P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {gameLeaderboard.map((g, i) => (
                    <tr key={g.game_id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="font-semibold text-gray-800 text-xs">{g.game_name}</span>
                        </div>
                      </td>
                      <td className="py-1.5">
                        {g.best ? (
                          <div className="flex items-center gap-1.5">
                            <PlayerAvatar player={{ name: g.best.player_name, color: g.best.player_color, avatar_url: g.best.avatar_url }} className="w-5 h-5 rounded-full text-[9px]" />
                            <span className="text-xs text-gray-700 truncate">{g.best.player_name}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-1.5 text-center text-xs">
                        <span className="text-emerald-600 font-semibold">{g.best?.wins ?? 0}</span>
                        <span className="text-gray-400">/{g.best?.games_played ?? 0}</span>
                      </td>
                      <td className="py-1.5">
                        {g.worst ? (
                          <div className="flex items-center gap-1.5">
                            <PlayerAvatar player={{ name: g.worst.player_name, color: g.worst.player_color, avatar_url: g.worst.avatar_url }} className="w-5 h-5 rounded-full text-[9px]" />
                            <span className="text-xs text-gray-700 truncate">{g.worst.player_name}</span>
                          </div>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-1.5 text-center text-xs">
                        <span className="text-red-500 font-semibold">{g.worst?.losses ?? 0}</span>
                        <span className="text-gray-400">/{g.worst?.games_played ?? 0}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
