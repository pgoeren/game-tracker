import { useState } from 'react';
import { useFetch, api } from '../hooks/useApi';
import { Plus, Pencil, Trash2, X, Check, Gamepad2, RefreshCw, Loader, Link } from 'lucide-react';

const ACCENTS = ['#ef4444','#8b5cf6','#3b82f6','#f59e0b','#10b981','#ec4899','#6366f1','#14b8a6'];

function GameForm({ initial, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return setError('Name is required');
    setSaving(true);
    try {
      const result = initial
        ? await api('PUT', `/games/${initial.id}`, { name })
        : await api('POST', '/games', { name });
      onSave(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 border-l-4 border-red-500">
      <h3 className="font-semibold text-gray-800">{initial ? 'Edit Game' : 'Add New Game'}</h3>
      {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div>
        <label className="text-sm text-gray-500 mb-1 block font-medium">Game Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Catan, Ticket to Ride, Codenames…" autoFocus />
      </div>
      {saving && (
        <p className="text-xs text-purple-500 flex items-center gap-1.5">
          <Loader size={12} className="animate-spin" /> Saving and searching for cover art…
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={saving}>
          <Check size={15} /> {saving ? 'Saving…' : 'Save Game'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          <X size={15} /> Cancel
        </button>
      </div>
    </form>
  );
}

function PasteUrlForm({ gameId, onSaved, onCancel }) {
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!url.trim()) return setError('Paste an image URL');
    setSaving(true);
    try {
      await api('PUT', `/games/${gameId}/cover`, { image_url: url.trim() });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <input
        className="input flex-1 text-xs py-1.5"
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="Paste image URL (right-click any box art → Copy Image Address)"
        autoFocus
      />
      <button type="submit" className="btn-primary py-1.5 text-xs" disabled={saving}>
        <Check size={13} /> Save
      </button>
      <button type="button" className="btn-ghost py-1.5 text-xs" onClick={onCancel}>
        <X size={13} />
      </button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </form>
  );
}

function GameCard({ game, index, onEdit, onDelete, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const accent = ACCENTS[index % ACCENTS.length];

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await api('POST', `/games/${game.id}/cover`);
      onRefresh();
    } catch (_) {
      setShowPaste(true);
    }
    setRefreshing(false);
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Cover art or placeholder */}
        <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: `${accent}18`, border: `1.5px solid ${accent}44` }}>
          {game.image_url ? (
            <img src={game.image_url} alt={game.name} className="w-full h-full object-cover" />
          ) : (
            <Gamepad2 size={22} style={{ color: accent }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800">{game.name}</p>
          <p className="text-xs text-gray-400">Added {new Date(game.created_at).toLocaleDateString()}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Refresh/find cover button */}
          <button
            className="btn-ghost p-2 rounded-lg"
            onClick={handleRefresh}
            disabled={refreshing}
            title={game.image_url ? 'Refresh cover art' : 'Find cover art'}>
            {refreshing
              ? <Loader size={14} className="animate-spin text-purple-400" />
              : <RefreshCw size={14} className="text-purple-400" />}
          </button>
          {/* Paste URL button */}
          <button
            className="btn-ghost p-2 rounded-lg"
            onClick={() => setShowPaste(p => !p)}
            title="Paste image URL">
            <Link size={14} className="text-purple-400" />
          </button>
          <button className="btn-ghost p-2 rounded-lg" onClick={() => onEdit(game)}>
            <Pencil size={15} className="text-purple-500" />
          </button>
          <button className="btn-danger p-2 rounded-lg" onClick={() => onDelete(game.id)}>
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {showPaste && (
        <PasteUrlForm
          gameId={game.id}
          onSaved={() => { setShowPaste(false); onRefresh(); }}
          onCancel={() => setShowPaste(false)}
        />
      )}
    </div>
  );
}

export default function Games() {
  const { data: games, loading, refetch } = useFetch('/games');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  async function handleDelete(id) {
    if (!confirm('Delete this game? All sessions using it will also be deleted.')) return;
    await api('DELETE', `/games/${id}`);
    refetch();
  }

  function handleSaved() {
    setShowForm(false);
    setEditing(null);
    refetch();
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="page-title">Games</h1>
          <p className="breadcrumb">Home / <span className="text-gray-600">Games</span></p>
        </div>
        {!showForm && !editing && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add Game
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4">
          <GameForm onSave={handleSaved} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 animate-pulse text-sm">Loading…</p>
      ) : games?.length === 0 && !showForm ? (
        <div className="card text-center py-16">
          <Gamepad2 size={40} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">No games in library</p>
          <p className="text-gray-400 text-sm mt-1">Cover art is fetched automatically when you add a game</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {games?.map((g, i) => (
            editing?.id === g.id ? (
              <GameForm key={g.id} initial={g} onSave={handleSaved} onCancel={() => setEditing(null)} />
            ) : (
              <GameCard key={g.id} game={g} index={i} onEdit={setEditing} onDelete={handleDelete} onRefresh={refetch} />
            )
          ))}
        </div>
      )}
    </div>
  );
}
