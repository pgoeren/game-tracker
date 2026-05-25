import { useState } from 'react';
import { useFetch, api } from '../hooks/useApi';
import { Plus, Pencil, Trash2, X, Check, Users, Gamepad2, Flame, Star, ChevronRight, Camera } from 'lucide-react';
import PlayerAvatar from '../components/PlayerAvatar';

const COLORS = [
  '#ef4444','#8b5cf6','#3b82f6','#f59e0b','#10b981',
  '#ec4899','#6366f1','#14b8a6','#f97316','#84cc16',
];

const RESULT_COLOR = {
  win:  'text-emerald-600 bg-emerald-50',
  loss: 'text-red-500 bg-red-50',
  draw: 'text-amber-600 bg-amber-50',
};

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {COLORS.map(c => (
        <button key={c} type="button" onClick={() => onChange(c)}
          className="w-7 h-7 rounded-full transition-transform hover:scale-110 focus:outline-none"
          style={{ backgroundColor: c, boxShadow: value === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : 'none' }}
        />
      ))}
    </div>
  );
}

function PlayerForm({ initial, onSave, onCancel }) {
  const [name, setName]   = useState(initial?.name  || '');
  const [color, setColor] = useState(initial?.color || COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const [avatarFile, setAvatarFile]       = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(initial?.avatar_url || null);
  const [removeAvatar, setRemoveAvatar]   = useState(false);

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      const result = initial
        ? await api('PUT', `/players/${initial.id}`, { name, color })
        : await api('POST', '/players', { name, color });

      if (avatarFile) {
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        const r = await fetch(`/api/players/${result.id}/avatar`, { method: 'POST', body: fd });
        if (r.ok) { onSave(await r.json()); return; }
      }

      if (removeAvatar && initial?.avatar_url) {
        const r = await fetch(`/api/players/${result.id}/avatar`, { method: 'DELETE' });
        if (r.ok) { onSave(await r.json()); return; }
      }

      onSave(result);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const initials = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <form onSubmit={handleSubmit} className="p-4 border border-purple-200 rounded-xl bg-purple-50/40 space-y-3">
      {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

      {/* Avatar picker */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="relative group">
          <label className="cursor-pointer block">
            <div
              className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-black border-2 border-white shadow"
              style={{ backgroundColor: avatarPreview ? undefined : color }}>
              {avatarPreview
                ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" />
                : initials}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <Camera size={18} className="text-white" />
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </label>
          {avatarPreview && (
            <button type="button" onClick={handleRemoveAvatar}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors">
              <X size={10} className="text-white" />
            </button>
          )}
        </div>
        <p className="text-[10px] text-gray-400">Click to add photo</p>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">Name</label>
        <input className="input text-sm" value={name} onChange={e => setName(e.target.value)} placeholder="Player name" autoFocus />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block font-medium">Color</label>
        <ColorPicker value={color} onChange={setColor} />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary text-xs py-1.5" disabled={saving}>
          <Check size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn-ghost text-xs py-1.5" onClick={onCancel}>
          <X size={13} /> Cancel
        </button>
      </div>
    </form>
  );
}

function WinRateBar({ value }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg,#8b5cf6,#ef4444)' }} />
      </div>
      <span className="text-xs font-semibold text-gray-400 w-8 text-right">{value}%</span>
    </div>
  );
}

function PlayerProfile({ playerId }) {
  const { data, loading } = useFetch(playerId ? `/players/${playerId}/stats` : null);

  if (!playerId) return (
    <div className="flex flex-col items-center justify-center h-full text-center py-24">
      <Users size={48} className="text-gray-200 mb-4" />
      <p className="text-gray-400 font-medium">Select a player</p>
      <p className="text-gray-300 text-sm mt-1">Click any player on the left to view their profile</p>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-gray-400 animate-pulse text-sm">Loading…</p>
    </div>
  );

  if (!data) return null;

  const { player, overall, gameBreakdown, recentSessions } = data;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <PlayerAvatar player={player} className="w-16 h-16 rounded-2xl text-2xl shadow-md" />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-800">{player.name}</h2>
          {gameBreakdown[0] && (
            <p className="text-xs text-purple-500 flex items-center gap-1 mt-0.5">
              <Star size={10} /> Favorite: {gameBreakdown[0].game_name}
            </p>
          )}
          <div className="mt-1.5"><WinRateBar value={overall.win_rate || 0} /></div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Played', value: overall.games_played, color: 'text-gray-700' },
          { label: 'Wins',   value: overall.wins,         color: 'text-purple-600' },
          { label: 'Losses', value: overall.losses,       color: 'text-red-500' },
          { label: 'Draws',  value: overall.draws,        color: 'text-amber-500' },
        ].map(s => (
          <div key={s.label} className="card text-center py-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">By Game</p>
            <h3 className="text-sm font-bold text-gray-800 mt-0.5">Game Record</h3>
          </div>
          <Gamepad2 size={16} className="text-blue-500" />
        </div>
        {gameBreakdown.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No games played yet</p>
        ) : (
          <div className="space-y-3">
            {gameBreakdown.map(g => (
              <div key={g.game_id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-gray-100 flex items-center justify-center">
                  {g.image_url
                    ? <img src={g.image_url} alt={g.game_name} className="w-full h-full object-cover" />
                    : <Gamepad2 size={14} className="text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs truncate">{g.game_name}</p>
                  <WinRateBar value={g.win_rate || 0} />
                </div>
                <div className="flex items-center gap-1 shrink-0 text-[11px] font-semibold">
                  <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">{g.wins}W</span>
                  <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500">{g.losses}L</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">{g.games_played}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">History</p>
            <h3 className="text-sm font-bold text-gray-800 mt-0.5">Recent Sessions</h3>
          </div>
          <Flame size={16} className="text-orange-500" />
        </div>
        {recentSessions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">No sessions yet</p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg shrink-0 ${RESULT_COLOR[s.result]}`}>
                  {s.result === 'win' ? '🥇' : s.result === 'loss' ? '💀' : '🤝'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-xs truncate">{s.game_name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {s.others.map((o, i) => (
                      <PlayerAvatar key={i} player={o} className="w-4 h-4 rounded-full text-[8px]" />
                    ))}
                    <p className="text-[10px] text-gray-400 ml-1 truncate">{s.others.map(o => o.name).join(', ')}</p>
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
  );
}

export default function Players() {
  const { data: players, loading, refetch } = useFetch('/players');
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  async function handleDelete(id) {
    if (!confirm('Delete this player? Their session history will remain.')) return;
    await api('DELETE', `/players/${id}`);
    if (selectedId === id) setSelectedId(null);
    refetch();
  }

  function handleSaved(player) {
    setShowForm(false);
    setEditing(null);
    setSelectedId(player.id);
    refetch();
  }

  return (
    <div className="flex h-full">
      <div className="w-72 shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="page-title text-lg">Players</h1>
            <p className="text-xs text-gray-400">{players?.length || 0} total</p>
          </div>
          {!showForm && (
            <button className="btn-primary text-xs py-1.5 px-3" onClick={() => { setShowForm(true); setEditing(null); }}>
              <Plus size={13} /> Add
            </button>
          )}
        </div>

        {showForm && (
          <div className="px-4 py-3 border-b border-gray-100">
            <PlayerForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8 animate-pulse">Loading…</p>
          ) : players?.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No players yet</p>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {players.map(p => (
                editing?.id === p.id ? (
                  <div key={p.id} className="px-1 py-2">
                    <PlayerForm initial={p} onSave={handleSaved} onCancel={() => setEditing(null)} />
                  </div>
                ) : (
                  <button key={p.id} onClick={() => setSelectedId(p.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                      selectedId === p.id ? 'bg-purple-50 border border-purple-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}>
                    <PlayerAvatar player={p} className="w-9 h-9 rounded-full text-sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">
                        Added {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                      <button className="p-1.5 rounded-lg hover:bg-white transition-colors"
                        onClick={() => { setEditing(p); setShowForm(false); }} title="Edit">
                        <Pencil size={13} className="text-purple-400" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-white transition-colors"
                        onClick={() => handleDelete(p.id)} title="Delete">
                        <Trash2 size={13} className="text-red-400" />
                      </button>
                    </div>
                    {selectedId === p.id && <ChevronRight size={14} className="text-purple-400 shrink-0" />}
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        <PlayerProfile playerId={selectedId} />
      </div>
    </div>
  );
}
