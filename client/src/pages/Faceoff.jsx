import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useApi';
import { Zap, Users, Gamepad2, ShieldAlert } from 'lucide-react';

const RESULT_COLORS = {
  win:  { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Win' },
  loss: { bg: 'bg-red-50',     text: 'text-red-500',     label: 'Loss' },
  draw: { bg: 'bg-amber-50',   text: 'text-amber-600',   label: 'Draw' },
};

function PlayerPanel({ players, value, onChange, exclude, side, stats }) {
  const selected = players?.find(p => String(p.id) === String(value));

  return (
    <div className="flex-1 flex flex-col items-center gap-3">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300 transition"
        style={selected ? { borderColor: `${selected.color}80` } : {}}>
        <option value="">— Select Player {side} —</option>
        {players?.filter(p => String(p.id) !== String(exclude)).map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div
        className="w-full rounded-2xl flex flex-col items-center py-7 px-4 gap-3 min-h-[200px] justify-center transition-all"
        style={selected
          ? { background: `linear-gradient(160deg, ${selected.color}22 0%, ${selected.color}08 100%)`, border: `1.5px solid ${selected.color}40` }
          : { background: '#f9fafb', border: '1.5px dashed #e5e7eb' }}>
        {selected ? (
          <>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-lg"
              style={{ backgroundColor: selected.color, boxShadow: `0 8px 24px ${selected.color}50` }}>
              {selected.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-center">
              <p className="font-black text-gray-800 text-xl tracking-tight">{selected.name}</p>
              {stats && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg">{stats.wins}W</span>
                  <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">{stats.losses}L</span>
                  <span className="text-xs font-semibold text-gray-500">{stats.win_rate}% WR</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center">
            <Users size={36} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400 font-medium">Pick a player</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProbabilityBar({ p1, p2, color1, color2, name1, name2 }) {
  const winner = p1 >= p2 ? { name: name1, prob: p1, color: color1 } : { name: name2, prob: p2, color: color2 };
  const diff = Math.abs(p1 - p2);
  const edgeLabel = diff <= 5 ? 'Toss-up' : diff <= 15 ? 'Slight edge' : diff <= 30 ? 'Likely' : 'Strong favourite';

  return (
    <div className="space-y-4">
      {/* Winner call — big and obvious */}
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Predicted Winner</p>
        <div
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-black text-lg shadow-md"
          style={{ background: `linear-gradient(135deg, ${winner.color}, ${winner.color}bb)`, boxShadow: `0 4px 20px ${winner.color}40` }}>
          <Zap size={18} />
          {winner.name}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">{edgeLabel} · {winner.prob}% chance</p>
      </div>

      {/* Bar */}
      <div>
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5 px-0.5"
          style={{ color: color1 }}>
          <span style={{ color: color1 }}>{name1} · {p1}%</span>
          <span style={{ color: color2 }}>{p2}% · {name2}</span>
        </div>
        <div className="h-6 rounded-full overflow-hidden flex shadow-inner">
          <div className="h-full flex items-center justify-end pr-2 transition-all duration-700"
            style={{ width: `${p1}%`, background: `linear-gradient(90deg, ${color1}cc, ${color1})` }}>
            {p1 >= 25 && <span className="text-[11px] font-black text-white">{p1}%</span>}
          </div>
          <div className="h-full flex items-center justify-start pl-2 transition-all duration-700"
            style={{ width: `${p2}%`, background: `linear-gradient(90deg, ${color2}, ${color2}cc)` }}>
            {p2 >= 25 && <span className="text-[11px] font-black text-white">{p2}%</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function H2HRecord({ h2h, p1Name, p2Name, color1, color2 }) {
  if (h2h.total === 0) return (
    <div className="text-center py-3 text-sm text-gray-400 flex items-center gap-2 justify-center">
      <ShieldAlert size={16} className="text-gray-300 shrink-0" />
      No head-to-head history — prediction based on overall win rates
    </div>
  );

  return (
    <div className="flex items-center justify-around">
      <div className="text-center">
        <p className="text-4xl font-black" style={{ color: color1 }}>{h2h.p1_wins}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{p1Name}</p>
      </div>
      <div className="text-center">
        <p className="text-2xl font-black text-gray-300">{h2h.draws}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">Draws</p>
      </div>
      <div className="text-center">
        <p className="text-4xl font-black" style={{ color: color2 }}>{h2h.p2_wins}</p>
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-1">{p2Name}</p>
      </div>
    </div>
  );
}

export default function Faceoff() {
  const { data: players } = useFetch('/players');
  const { data: games }   = useFetch('/games');

  const [p1Id, setP1Id]     = useState('');
  const [p2Id, setP2Id]     = useState('');
  const [gameId, setGameId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch faceoff data whenever players or game changes
  useEffect(() => {
    if (!p1Id || !p2Id) { setResult(null); return; }

    setLoading(true);
    setResult(null);

    const params = new URLSearchParams({ p1: p1Id, p2: p2Id });
    if (gameId) params.set('game', gameId);

    fetch(`/api/sessions/faceoff?${params}`)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(setResult)
      .catch(err => console.error('Faceoff error:', err))
      .finally(() => setLoading(false));
  }, [p1Id, p2Id, gameId]);

  const p1Player = players?.find(p => String(p.id) === String(p1Id));
  const p2Player = players?.find(p => String(p.id) === String(p2Id));

  const confidenceBadge = {
    low:    { label: '⚠️ Low confidence — no head-to-head data', cls: 'bg-gray-100 text-gray-500' },
    medium: { label: '📊 Medium confidence — small sample size',  cls: 'bg-amber-50 text-amber-600' },
    high:   { label: '✅ High confidence — strong H2H history',   cls: 'bg-emerald-50 text-emerald-600' },
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="page-title">Face Off</h1>
        <p className="breadcrumb">Home / <span className="text-gray-600">Face Off</span></p>
      </div>

      <div className="card space-y-5">

        {/* Player selectors + avatars */}
        <div className="flex items-start gap-4">
          <PlayerPanel
            players={players} value={p1Id} onChange={setP1Id}
            exclude={p2Id} side="1"
            stats={result?.player1?.overall}
          />
          <div className="flex flex-col items-center justify-center pt-10 shrink-0 gap-1.5">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-red-500 flex items-center justify-center shadow-lg shadow-purple-300">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">vs</span>
          </div>
          <PlayerPanel
            players={players} value={p2Id} onChange={setP2Id}
            exclude={p1Id} side="2"
            stats={result?.player2?.overall}
          />
        </div>

        {/* Game filter */}
        <div className="flex items-center gap-2">
          <Gamepad2 size={14} className="text-gray-400 shrink-0" />
          <select
            value={gameId}
            onChange={e => setGameId(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-300">
            <option value="">All Games</option>
            {games?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>

        {/* Results */}
        {!p1Id || !p2Id ? (
          <div className="border-t border-gray-100 pt-5 text-center py-10">
            <Users size={36} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 font-medium">Select both players above to see the prediction</p>
          </div>
        ) : loading ? (
          <div className="border-t border-gray-100 pt-5 text-center py-10">
            <p className="text-gray-400 animate-pulse">Calculating…</p>
          </div>
        ) : result ? (
          <div className="border-t border-gray-100 pt-5 space-y-5">

            {/* Probability + winner call */}
            <ProbabilityBar
              p1={result.probability.p1}
              p2={result.probability.p2}
              color1={p1Player?.color || '#8b5cf6'}
              color2={p2Player?.color || '#ef4444'}
              name1={p1Player?.name || 'Player 1'}
              name2={p2Player?.name || 'Player 2'}
            />

            {/* Confidence badge */}
            <div className="flex justify-center">
              <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${confidenceBadge[result.confidence]?.cls}`}>
                {confidenceBadge[result.confidence]?.label}
              </span>
            </div>

            {/* H2H scoreboard */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Head to Head</p>
                {result.h2h.total > 0 && (
                  <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {result.h2h.total} {result.h2h.total === 1 ? 'match' : 'matches'}
                  </span>
                )}
              </div>
              <H2HRecord
                h2h={result.h2h}
                p1Name={p1Player?.name}
                p2Name={p2Player?.name}
                color1={p1Player?.color || '#8b5cf6'}
                color2={p2Player?.color || '#ef4444'}
              />
            </div>

            {/* Recent H2H sessions */}
            {result.recentSessions.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Meetings</p>
                <div className="space-y-1.5">
                  {result.recentSessions.map(s => {
                    const p1r = RESULT_COLORS[s.p1_result] || RESULT_COLORS.draw;
                    const p2r = RESULT_COLORS[s.p2_result] || RESULT_COLORS.draw;
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <span className="text-[10px] text-gray-400 w-14 shrink-0">
                          {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="flex-1 text-xs font-semibold text-gray-700 truncate">{s.game_name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${p1r.bg} ${p1r.text}`}>
                          {p1Player?.name?.split(' ')[0]}: {p1r.label}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${p2r.bg} ${p2r.text}`}>
                          {p2Player?.name?.split(' ')[0]}: {p2r.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        ) : null}
      </div>
    </div>
  );
}
