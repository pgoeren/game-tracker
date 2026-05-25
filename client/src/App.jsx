import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Gamepad2, ClipboardList, Trophy, Swords } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Players from './pages/Players';
import Games from './pages/Games';
import Sessions from './pages/Sessions';
import Leaderboard from './pages/Leaderboard';
import PlayerProfile from './pages/PlayerProfile';
import Faceoff from './pages/Faceoff';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: ClipboardList, label: 'Sessions' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/faceoff', icon: Swords, label: 'Face Off' },
  { to: '/players', icon: Users, label: 'Players' },
  { to: '/games', icon: Gamepad2, label: 'Games' },
];

const pageTitles = {
  '/': 'Dashboard',
  '/sessions': 'Sessions',
  '/leaderboard': 'Leaderboard',
  '/faceoff': 'Face Off',
  '/players': 'Players',
  '/games': 'Games',
};

export default function App() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Game Tracker';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col" style={{ background: 'linear-gradient(180deg, #3d1f8f 0%, #2a1360 100%)' }}>
        {/* Logo */}
        <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center shadow-lg shadow-red-900/40">
            <Gamepad2 size={18} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight">GameTracker</div>
            <div className="text-purple-300 text-[10px] font-medium uppercase tracking-wider">Board Games</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-purple-200 hover:text-white hover:bg-white/10'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-purple-400 text-[11px]">
          v1.0 · Game Tracker
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/faceoff" element={<Faceoff />} />
            <Route path="/players/:id" element={<PlayerProfile />} />
            <Route path="/players" element={<Players />} />
            <Route path="/games" element={<Games />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
