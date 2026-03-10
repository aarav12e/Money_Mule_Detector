import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Search, History, LogOut, Shield, Activity } from 'lucide-react'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/analyze', icon: Search, label: 'Analyze' },
    { to: '/history', icon: History, label: 'History' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <Shield size={18} style={{ color: 'var(--accent-green)' }} />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>FinForge</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Fraud Detection</div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="mx-4 mt-4 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
          <div className="w-2 h-2 rounded-full pulse-green" style={{ background: 'var(--accent-green)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--accent-green)' }}>SYSTEM ONLINE</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 flex flex-col gap-1 mt-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'text-accent-green'
                    : 'text-muted hover:text-white'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(0,255,136,0.08)',
                border: '1px solid rgba(0,255,136,0.2)',
                color: 'var(--accent-green)',
              } : {
                color: 'var(--text-muted)',
              }}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(0,212,255,0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(0,212,255,0.3)' }}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{user?.name || 'Analyst'}</div>
              <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn-ghost w-full flex items-center justify-center gap-2 text-xs">
            <LogOut size={13} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
