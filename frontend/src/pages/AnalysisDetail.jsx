import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, Download, Clock, FileText, Loader } from 'lucide-react'
import { format } from 'date-fns'
import GraphView from '../components/GraphView'
import RingTable from '../components/RingTable'
import toast from 'react-hot-toast'

function getRiskClass(score) {
  if (score >= 90) return 'risk-critical'
  if (score >= 70) return 'risk-high'
  if (score >= 50) return 'risk-medium'
  return 'risk-low'
}

export default function AnalysisDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('graph')

  useEffect(() => {
    api.get(`/history/${id}`)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analysis'))
      .finally(() => setLoading(false))
  }, [id])

  const downloadJSON = () => {
    if (!data) return
    const { _id, user_id, ...exportData } = data
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finforge_${data.filename}_${id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    if (!data || !data.suspicious_accounts) return;
    const headers = ['Account ID', 'Suspicion Score', 'Ring ID', 'Detected Patterns'];
    const rows = data.suspicious_accounts.map(acc => [
      acc.account_id,
      acc.suspicion_score,
      acc.ring_id || 'None',
      `"${acc.detected_patterns.join(', ')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suspicious_accounts_${data.filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const printReport = () => {
    window.print();
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full py-24">
      <Loader size={24} className="animate-spin" style={{ color: 'var(--accent-green)' }} />
    </div>
  )

  if (!data) return (
    <div className="p-8 text-center">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Analysis not found</div>
      <Link to="/history" style={{ color: 'var(--accent-green)' }} className="text-xs mt-2 inline-block">← Back to history</Link>
    </div>
  )

  const tabs = ['graph', 'rings', 'accounts']

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link to="/history" className="flex items-center gap-1.5 text-xs mb-3 hover:text-white transition-colors" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft size={12} /> Back to history
          </Link>
          <h1 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{data.filename}</h1>
          <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1"><Clock size={10} /> {format(new Date(data.uploaded_at), 'MMM d, yyyy HH:mm')}</span>
            <span>·</span>
            <span>{data.csv_row_count?.toLocaleString()} transactions</span>
            <span>·</span>
            <span>{data.summary?.processing_time_seconds}s processing</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={printReport} className="btn-ghost flex items-center gap-2">
            <FileText size={14} /> Print PDF
          </button>
          <button onClick={downloadCSV} className="btn-ghost flex items-center gap-2">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={downloadJSON} className="btn-primary flex items-center gap-2">
            <Download size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Accounts Analyzed', value: data.summary?.total_accounts_analyzed, color: '0,212,255' },
          { label: 'Fraud Rings', value: data.summary?.fraud_rings_detected, color: '255,51,85' },
          { label: 'Suspicious Accounts', value: data.summary?.suspicious_accounts_flagged, color: '255,140,0' },
          { label: 'Processing Time', value: `${data.summary?.processing_time_seconds}s`, color: '0,255,136' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold font-mono" style={{ color: `rgb(${color})` }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="glass-card overflow-hidden" style={{ height: 600 }}>
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-5 py-3 text-xs font-medium uppercase tracking-wider transition-all"
              style={{
                color: activeTab === tab ? 'var(--accent-green)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--accent-green)' : '2px solid transparent',
                background: 'transparent',
                cursor: 'pointer',
                fontFamily: 'Space Grotesk',
              }}
            >
              {tab === 'graph' ? 'Network Graph' : tab === 'rings' ? `Fraud Rings (${data.fraud_rings?.length || 0})` : `Suspicious Accounts (${data.suspicious_accounts?.length || 0})`}
            </button>
          ))}
        </div>

        <div style={{ height: 'calc(100% - 45px)', overflow: 'auto' }}>
          {activeTab === 'graph' && data.graph && (
            <div style={{ height: '100%' }}>
              <GraphView
                graph={data.graph}
                suspiciousAccounts={data.suspicious_accounts || []}
                fraudRings={data.fraud_rings || []}
              />
            </div>
          )}

          {activeTab === 'rings' && (
            <div className="p-4">
              <RingTable rings={data.fraud_rings || []} />
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="p-4">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Account ID', 'Suspicion Score', 'Ring', 'Patterns'].map(h => (
                      <th key={h} className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.suspicious_accounts || []).map((acc, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(26,51,84,0.5)' }}>
                      <td className="py-2 px-3 font-mono" style={{ color: 'var(--accent-blue)' }}>{acc.account_id}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded font-medium ${getRiskClass(acc.suspicion_score)}`}>
                          {acc.suspicion_score}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono" style={{ color: 'var(--accent-orange)' }}>{acc.ring_id}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>{acc.detected_patterns.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
