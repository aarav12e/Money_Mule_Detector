import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { Shield, AlertTriangle, Activity, Upload, ArrowRight, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useThemeContext } from '../context/ThemeContext'

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `rgba(${color},0.1)`, border: `1px solid rgba(${color},0.25)` }}>
          <Icon size={18} style={{ color: `rgb(${color})` }} />
        </div>
      </div>
      <div className="text-2xl font-bold mb-0.5" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{value}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
      {sub && <div className="text-xs mt-1" style={{ color: `rgb(${color})` }}>{sub}</div>}
    </div>
  )
}

function getRiskClass(score) {
  if (score >= 90) return 'risk-critical'
  if (score >= 70) return 'risk-high'
  if (score >= 50) return 'risk-medium'
  return 'risk-low'
}

export default function Dashboard() {
  const { user } = useAuth()
  const { currentTheme } = useThemeContext()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/history').then(r => {
      setHistory(r.data)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalAnalyses = history.length
  const totalRings = history.reduce((a, h) => a + (h.summary?.fraud_rings_detected || 0), 0)
  const totalSuspicious = history.reduce((a, h) => a + (h.summary?.suspicious_accounts_flagged || 0), 0)
  const totalTxns = history.reduce((a, h) => a + (h.csv_row_count || 0), 0)

  // Format data for chart (reverse to show chronological order left-to-right)
  const chartData = [...history].reverse().slice(-10).map(h => ({
    name: format(new Date(h.uploaded_at), 'MMM dd'),
    Rings: h.summary?.fraud_rings_detected || 0,
    Suspicious: h.summary?.suspicious_accounts_flagged || 0
  }));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full pulse-green" style={{ background: 'var(--accent-green)' }} />
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>OPERATIONAL</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {user?.name || 'Analyst'}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Financial intelligence overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Activity} label="Total Analyses" value={totalAnalyses} color="0,212,255" />
        <StatCard icon={AlertTriangle} label="Fraud Rings" value={totalRings} color="255,51,85" sub={totalRings > 0 ? 'Requires attention' : 'Clean'} />
        <StatCard icon={Shield} label="Flagged Accounts" value={totalSuspicious} color="255,140,0" />
        <StatCard icon={Upload} label="Transactions Scanned" value={totalTxns.toLocaleString()} color="0,255,136" />
      </div>

      {/* Quick Action */}
      <div className="glass-card p-6 mb-8 flex items-center justify-between glow-green">
        <div>
          <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Run New Analysis</h3>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Upload a CSV to detect money muling networks</p>
        </div>
        <Link to="/analyze" className="btn-primary flex items-center gap-2">
          Upload CSV <ArrowRight size={14} />
        </Link>
      </div>

      {/* Analytics Chart */}
      {!loading && history.length > 0 && (
        <div className="glass-card p-6 mb-8">
          <h2 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Recent Detection Trends</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke={currentTheme.palette.text.secondary} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={currentTheme.palette.text.secondary} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: currentTheme.palette.background.paper, borderColor: currentTheme.palette.divider, borderRadius: '8px', color: currentTheme.palette.text.primary }}
                  itemStyle={{ color: currentTheme.palette.text.primary, fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Suspicious" fill={currentTheme.palette.warning.main} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Rings" fill={currentTheme.palette.error.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent analyses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Analyses</h2>
          <Link to="/history" className="text-xs" style={{ color: 'var(--accent-green)' }}>View all →</Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>LOADING...</div>
        ) : history.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <div className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>NO ANALYSES YET</div>
            <Link to="/analyze" className="text-xs" style={{ color: 'var(--accent-green)' }}>Upload your first CSV →</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {history.slice(0, 5).map(item => (
              <Link key={item._id} to={`/history/${item._id}`} className="glass-card p-4 flex items-center justify-between hover:border-opacity-60 transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(0,212,255,0.2)' }}>
                    {(item.summary?.fraud_rings_detected || 0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.filename}</div>
                    <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={10} />
                      {formatDistanceToNow(new Date(item.uploaded_at), { addSuffix: true })}
                      <span>·</span>
                      <span>{item.csv_row_count?.toLocaleString()} txns</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.summary?.fraud_rings_detected > 0 && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskClass(item.summary?.fraud_rings_detected * 20)}`}>
                      {item.summary.fraud_rings_detected} rings
                    </span>
                  )}
                  <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
