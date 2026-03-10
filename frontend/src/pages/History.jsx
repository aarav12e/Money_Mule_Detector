import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { formatDistanceToNow, format } from 'date-fns'
import { FileText, ArrowRight, Trash2, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

function getRiskClass(rings) {
  if (rings >= 5) return 'risk-critical'
  if (rings >= 3) return 'risk-high'
  if (rings >= 1) return 'risk-medium'
  return 'risk-low'
}

export default function History() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/history').then(r => setHistory(r.data)).catch(() => toast.error('Failed to load history')).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this analysis?')) return
    try {
      await api.delete(`/history/${id}`)
      setHistory(h => h.filter(x => x._id !== id))
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Analysis History</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{history.length} past analyses</p>
        </div>
        <Link to="/analyze" className="btn-primary text-sm">+ New Analysis</Link>
      </div>

      {loading ? (
        <div className="text-center py-12 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>LOADING HISTORY...</div>
      ) : history.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>No analyses yet</div>
          <Link to="/analyze" style={{ color: 'var(--accent-green)' }} className="text-xs hover:underline">Run your first analysis →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map(item => (
            <Link key={item._id} to={`/history/${item._id}`} className="glass-card p-5 flex items-center gap-4 hover:border-opacity-70 transition-all group">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <FileText size={16} style={{ color: 'var(--accent-blue)' }} />
              </div>

              {/* Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{item.filename}</div>
                  {item.summary?.fraud_rings_detected > 0 && (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getRiskClass(item.summary.fraud_rings_detected)}`}>
                      {item.summary.fraud_rings_detected} rings
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(item.uploaded_at), { addSuffix: true })}
                  </span>
                  <span>{format(new Date(item.uploaded_at), 'MMM d, yyyy HH:mm')}</span>
                  <span>·</span>
                  <span>{item.csv_row_count?.toLocaleString()} transactions</span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                <div className="text-center">
                  <div className="text-lg font-bold font-mono" style={{ color: 'var(--accent-blue)' }}>{item.summary?.total_accounts_analyzed || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Accounts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono" style={{ color: 'var(--accent-red)' }}>{item.summary?.fraud_rings_detected || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Rings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono" style={{ color: 'var(--accent-orange)' }}>{item.summary?.suspicious_accounts_flagged || 0}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Flagged</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={(e) => handleDelete(item._id, e)} className="btn-danger p-2" title="Delete">
                  <Trash2 size={13} />
                </button>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
