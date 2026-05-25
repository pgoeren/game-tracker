import { useParams, Link } from 'react-router-dom';
import { useFetch } from '../hooks/useApi';
import { Trophy, Gamepad2, TrendingUp, Flame, ArrowLeft, Star } from 'lucide-react';

const RESULT_LABEL = { win: '1st Place', loss: 'Last Place', draw: 'Non-win, Non-loss' };
const RESULT_COLOR = { win: 'text-emerald-600 bg-emerald-50', loss: 'text-red-500 bg-red-50', draw: 'text-amber-600 bg-amber-50' };

function StatBox({ label, value, color }) {
  return (
    <div className="card text-center py-5">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function WinRateBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg,#8b5cf6,#ef4444)' }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-9 text-right">{value}%</span>
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams();
  const { data, loading } = useFetch(`/players/${id}/stats`);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!data) return null;

  const { player, overall, gameBreakdown, recentSessions } = data;

  return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Back link */}
      <Link to="/leaderboard" className="inline-flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-700 font-medium">
        <ArrowLeft size={14} /> Back to Leaderboard
      </Link>

      {/* Player header */}
      <div className="card flex items-center gap-6">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg shrink-0"
          style={{ backgroundColor: player.color }}>
          {player.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800">{player.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">Member since {new Date(player.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          {gameBreakdown[0] && (
            <p className="text-sm text-purple-500 flex items-center gap-1 mt-1">
              <Star size={12} /> Favorite: {gameBreakdown[0].game_name}
            </p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-3xl font-bold text-gray-800">{overall.win_rate}%</p>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Win Rate</p>
          <WinRateBar value={overall.win_rate || 0} />
        </div>
      </div>

      {/* Stat boxes */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatBox label="Games Played" value={overall.games_played} color="text-gray-800" />
        <StatBox label="Wins" value={overall.wins} color="text-purple-600" />
        <StatBox label="Losses" value={overall.losses} color="text-red-500" />
        <StatBox label="Draws" value={overall.draws} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Game breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">By Game</p>
              <h3 className="text-base font-bold text-gray-800 mt-0.5">Game Record</h3>
            </div>
            <Gamepad2 size={18} className="text-blue-500" />
          </div>

          {gameBreakdown.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No games played yet</p>
          ) : (
            <div className="space-y-3">
              {gameBreakdown.map(g => (
                <div key={g.game_id} className="flex items-center gap-3">
                  {/* Cover art or placeholder */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                    {g.image_url
                      ? <img src={g.image_url} alt={g.game_name} className="w-full h-full object-cover" />
                      : <Gamepad2 size={16} className="text-gray-400" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{g.game_name}</p>
                    <WinRateBar value={g.win_rate || 0} />
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 text-xs font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">{g.wins}W</span>
                    <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500">{g.losses}L</span>
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">{g.games_played}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sessions */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">History</p>
              <h3 className="text-base font-bold text-gray-800 mt-0.5">Recent Sessions</h3>
            </div>
            <Flame size={18} className="text-orange-500" />
          </div>

          {recentSessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sessions yet</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${RESULT_COLOR[s.result]}`}>
                    {s.result === 'win' ? '🥇' : s.result === 'loss' ? '💀' : '🤝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{s.game_name}</p>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {s.others.map((o, i) => (
                        <span key={i} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                          style={{ backgroundColor: o.color }} title={o.name}>
                          {o.name.charAt(0).toUpperCase()}
                        </span>
                      ))}
                      <span className="text-[10px] text-gray-400 ml-0.5">
                        {s.others.map(o => o.name).join(', ')}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 shrink-0">
                    {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
