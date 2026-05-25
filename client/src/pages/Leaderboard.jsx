import { Link } from 'react-router-dom';
import { useFetch } from '../hooks/useApi';
import { Trophy, Star, Gamepad2 } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';

function WinRateBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg, #8b5cf6, #ef4444)' }} />
      </div>
      <span className="text-xs font-semibold text-gray-500 w-9 text-right">{value}%</span>
    </div>
  );
}

export default function Leaderboard() {
  const { data, loading } = useFetch('/sessions/stats');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  if (!data) return null;

  const { playerStats } = data;

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="page-title">Leaderboard</h1>
        <p className="breadcrumb">Home / <span className="text-gray-600">Leaderboard</span></p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">All Players</p>
            <h3 className="text-base font-bold text-gray-800 mt-0.5">Full Rankings</h3>
          </div>
          <Trophy size={18} className="text-amber-500" />
        </div>

        {playerStats.length === 0 ? (
          <div className="text-center py-16">
            <Gamepad2 size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400">No players yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="pb-3 font-semibold text-left w-10">#</th>
                <th className="pb-3 font-semibold text-left">Player</th>
                <th className="pb-3 font-semibold text-center">Games</th>
                <th className="pb-3 font-semibold text-center">Wins</th>
                <th className="pb-3 font-semibold text-center">Losses</th>
                <th className="pb-3 font-semibold text-center">Draws</th>
                <th className="pb-3 font-semibold text-right pr-2">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {playerStats.map((p, i) => (
                <tr key={p.id} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'font-medium' : ''}`}>
                  <td className="py-3 text-gray-400">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : <span className="text-gray-300 font-normal">{i + 1}</span>}
                  </td>
                  <td className="py-3">
                    <Link to={`/players/${p.id}`} className="flex items-center gap-2.5 hover:opacity-75 transition-opacity">
                      <PlayerAvatar player={p} className="w-8 h-8 rounded-full text-xs" />
                      <div>
                        <p className="font-semibold text-gray-800">{p.name}</p>
                        {p.favorite_game && (
                          <p className="text-[10px] text-purple-500 flex items-center gap-0.5">
                            <Star size={9} /> {p.favorite_game}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="py-3 text-center text-gray-500">{p.games_played}</td>
                  <td className="py-3 text-center font-semibold text-purple-600">{p.wins}</td>
                  <td className="py-3 text-center font-semibold text-red-500">{p.losses}</td>
                  <td className="py-3 text-center text-gray-400">{p.draws}</td>
                  <td className="py-3 w-36 pr-2"><WinRateBar value={p.win_rate || 0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
