import { useState } from 'react';
import { useFetch, api } from '../hooks/useApi';
import { Plus, Pencil, Trash2, X, Check, ClipboardList, Trophy, UserPlus, Gamepad2 } from 'lucide-react';

const RESULTS = ['win', 'loss', 'draw'];
const resultStyle = {
  win:  { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  loss: { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  draw: { bg: '#fefce8', text: '#b45309', border: '#fde68a' },
};
const resultLabel = { win: '🥇 Win', loss: '💀 Loss', draw: '🤝 Draw' };

function SessionForm({ initial, games, players, onSave, onCancel }) {
  const today = new Date().toISOString().slice(0, 10);
  const [step, setStep] = useState(initial ? 2 : 1);
  const [gameId, setGameId] = useState(initial?.game_id?.toString() || '');
  const [date, setDate] = useState(initial?.date?.slice(0, 10) || today);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [sessionPlayers, setSessionPlayers] = useState(
    initial?.players?.map(p => ({ player_id: p.player_id.toString(), result: p.result, score: p.score ?? '' })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const usedIds = new Set(sessionPlayers.map(p => p.player_id));
  const selectedGame = games.find(g => g.id.toString() === gameId);

  function addPlayer(playerId) {
    if (!playerId || usedIds.has(playerId) || sessionPlayers.length >= 8) return;
    setSessionPlayers(prev => [...prev, { player_id: playerId, result: 'loss', score: '' }]);
  }

  function removePlayer(idx) {
    setSessionPlayers(prev => prev.filter((_, i) => i !== idx));
  }

  function updatePlayer(idx, field, value) {
    setSessionPlayers(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!gameId) return setError('Select a game');
    if (sessionPlayers.length < 1) return setError('Add at least one player');
    setSaving(true);
    try {
      const payload = {
        game_id: parseInt(gameId),
        date,
        notes: notes || null,
        players: sessionPlayers.map(p => ({
          player_id: parseInt(p.player_id),
          result: p.result,
          score: p.score !== '' ? parseFloat(p.score) : null,
        })),
      };
      const result = initial
        ? await api('PUT', `/sessions/${initial.id}`, payload)
        : await api('POST', '/sessions', payload);
      onSave(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const availablePlayers = players.filter(p => !usedIds.has(p.id.toString()));

  return (
    <div className="card border-l-4 border-purple-500 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg">{initial ? 'Edit Session' : 'Log New Session'}</h3>
        {!initial && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <span className={`px-2 py-0.5 rounded-full font-semibold ${step === 1 ? 'bg-purple-100 text-purple-700' : 'text-gray-400'}`}>1. Game</span>
            <span className="text-gray-300">→</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${step === 2 ? 'bg-purple-100 text-purple-700' : 'text-gray-400'}`}>2. Players</span>
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Step 1: Game + Date */}
      {(step === 1 || initial) && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Which game did you play?</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {games.map(g => (
                <button key={g.id} type="button"
                  onClick={() => setGameId(g.id.toString())}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all flex items-center gap-2 ${
                    gameId === g.id.toString()
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-purple-200 hover:bg-purple-50/50'
                  }`}>
                  <Gamepad2 size={14} className={gameId === g.id.toString() ? 'text-purple-500' : 'text-gray-400'} />
                  <span className="truncate">{g.name}</span>
                  {gameId === g.id.toString() && <Check size={13} className="ml-auto text-purple-500 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Date played</label>
              <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1.5 block">Notes (optional)</label>
              <input className="input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Epic comeback!" />
            </div>
          </div>

          {!initial && (
            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-primary" onClick={() => { if (!gameId) return setError('Select a game first'); setError(''); setStep(2); }}>
                Next: Add Players →
              </button>
              <button type="button" className="btn-ghost" onClick={onCancel}><X size={15} /> Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Players */}
      {(step === 2 || initial) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!initial && selectedGame && (
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Gamepad2 size={15} className="text-purple-500" />
              <span className="text-sm font-semibold text-purple-700">{selectedGame.name}</span>
              <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-gray-400 hover:text-purple-600 underline">change game</button>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-600">Who played? ({sessionPlayers.length}/8)</label>
              {availablePlayers.length > 0 && sessionPlayers.length < 8 && (
                <select
                  className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm"
                  value=""
                  onChange={e => { addPlayer(e.target.value); e.target.value = ''; }}>
                  <option value="">+ Add player…</option>
                  {availablePlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>

            {sessionPlayers.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
                <UserPlus size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Use the dropdown above to add players</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessionPlayers.map((sp, idx) => {
                  const player = players.find(p => p.id.toString() === sp.player_id);
                  const rs = resultStyle[sp.result];
                  return (
                    <div key={idx} className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: player?.color || '#8b5cf6' }}>
                        {player?.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 flex-1 min-w-[80px] truncate">{player?.name}</span>

                      {/* Result buttons */}
                      <div className="flex gap-1 ml-auto">
                        {RESULTS.map(r => (
                          <button key={r} type="button"
                            onClick={() => updatePlayer(idx, 'result', r)}
                            className="px-2 py-1 rounded-lg text-xs font-semibold border transition-all"
                            style={sp.result === r
                              ? { backgroundColor: rs.bg, color: rs.text, borderColor: rs.border }
                              : { backgroundColor: 'white', color: '#9ca3af', borderColor: '#e5e7eb' }}>
                            {resultLabel[r]}
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        placeholder="Score"
                        className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        value={sp.score}
                        onChange={e => updatePlayer(idx, 'score', e.target.value)}
                      />
                      <button type="button" className="text-gray-300 hover:text-red-400 transition-colors" onClick={() => removePlayer(idx)}>
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary" disabled={saving}>
              <Check size={15} /> {saving ? 'Saving…' : 'Save Session'}
            </button>
            {!initial && <button type="button" className="btn-ghost" onClick={() => setStep(1)}>← Back</button>}
            <button type="button" className="btn-ghost" onClick={onCancel}><X size={15} /> Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}

function SessionCard({ session, onEdit, onDelete }) {
  const winners = session.players.filter(p => p.result === 'win');

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-800">{session.game_name}</span>
            {winners.length > 0 && (
              <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                🥇 {winners.map(w => w.player_name).join(', ')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            {session.notes && <span className="ml-2 italic text-gray-300">"{session.notes}"</span>}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button className="btn-ghost p-2 rounded-lg" onClick={() => onEdit(session)}>
            <Pencil size={14} className="text-purple-500" />
          </button>
          <button className="btn-danger p-2 rounded-lg" onClick={() => onDelete(session.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {session.players.map((p, i) => {
          const rs = resultStyle[p.result];
          return (
            <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ backgroundColor: rs.bg, color: rs.text, borderColor: rs.border }}>
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ backgroundColor: p.player_color }}>
                {p.player_name.charAt(0)}
              </span>
              {p.result === 'win' ? '🥇 ' : p.result === 'loss' ? '💀 ' : ''}{p.player_name}
              {p.score != null && <span className="opacity-60 ml-0.5">({p.score})</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Sessions() {
  const { data: sessions, loading, refetch } = useFetch('/sessions');
  const { data: games } = useFetch('/games');
  const { data: players } = useFetch('/players');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function handleDelete(id) {
    if (!confirm('Delete this session?')) return;
    await api('DELETE', `/sessions/${id}`);
    refetch();
  }

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    refetch();
  }

  const ready = games && players;

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Sessions</h1>
          <p className="breadcrumb">Home / <span className="text-gray-600">Sessions</span></p>
        </div>
        {!showForm && !editing && ready && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Log Session
          </button>
        )}
      </div>

      {showForm && ready && (
        <div className="mb-6">
          <SessionForm games={games} players={players} onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 animate-pulse text-sm">Loading sessions…</p>
      ) : sessions?.length === 0 && !showForm ? (
        <div className="card text-center py-16">
          <ClipboardList size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No sessions logged yet</p>
          <p className="text-gray-400 text-sm mt-1">Hit "Log Session" to record your first game night</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions?.map(s => (
            editing?.id === s.id && ready ? (
              <SessionForm key={s.id} initial={s} games={games} players={players} onSave={handleSaved} onCancel={() => setEditing(null)} />
            ) : (
              <SessionCard key={s.id} session={s} onEdit={setEditing} onDelete={handleDelete} />
            )
          ))}
        </div>
      )}
    </div>
  );
}
