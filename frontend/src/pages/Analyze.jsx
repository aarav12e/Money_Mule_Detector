import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Upload, FileText, AlertTriangle, CheckCircle, Download, Loader, X } from 'lucide-react'
import GraphView from '../components/GraphView'
import RingTable from '../components/RingTable'

function getRiskClass(score) {
  if (score >= 90) return 'risk-critical'
  if (score >= 70) return 'risk-high'
  if (score >= 50) return 'risk-medium'
  return 'risk-low'
}

export default function Analyze() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [activeTab, setActiveTab] = useState('graph')

  const onDrop = useCallback((accepted, rejected) => {
    if (accepted.length) {
      setFile(accepted[0])
    } else if (rejected.length) {
      toast.error('Invalid file type or format. Please upload a CSV or Excel file.')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv', '.xls'],
      'application/csv': ['.csv'],
      'text/x-csv': ['.csv'],
      'application/x-csv': ['.csv'],
      'text/comma-separated-values': ['.csv'],
      'text/x-comma-separated-values': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
  })

  const handleAnalyze = async () => {
    if (!file) return toast.error('Please select a CSV file')
    setLoading(true)
    setResults(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResults(res.data)
      toast.success(`Analysis complete — ${res.data.summary.fraud_rings_detected} rings detected`)
      setActiveTab('graph')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setLoading(false)
    }
  }

  const downloadJSON = () => {
    if (!results) return
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finforge_analysis_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = ['graph', 'rings', 'accounts']

  return (
    <div className="p-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>New Analysis</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Upload a transaction CSV or Excel file to detect money muling networks</p>
      </div>

      {/* Upload */}
      <div className="glass-card p-6">
        <div
          {...getRootProps()}
          className="rounded-xl p-8 text-center cursor-pointer transition-all"
          style={{
            border: `2px dashed ${isDragActive ? 'var(--accent-green)' : 'var(--border)'}`,
            background: isDragActive ? 'rgba(0,255,136,0.05)' : 'transparent'
          }}
        >
          <input {...getInputProps()} />
          <Upload size={28} className="mx-auto mb-3" style={{ color: isDragActive ? 'var(--accent-green)' : 'var(--text-muted)' }} />
          {file ? (
            <div>
              <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-green)' }}>
                <FileText size={16} /> {file.name}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          ) : (
            <div>
              <div className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                {isDragActive ? 'Drop the file here' : 'Drag & drop CSV/Excel or click to browse'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Required columns: transaction_id, sender_id, receiver_id, amount, timestamp
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button onClick={handleAnalyze} className="btn-primary" disabled={!file || loading}>
            {loading ? <><Loader size={14} className="animate-spin" /> ANALYZING...</> : <><Upload size={14} /> RUN ANALYSIS</>}
          </button>
          {file && !loading && (
            <button onClick={() => { setFile(null); setResults(null) }} className="btn-ghost flex items-center gap-1.5">
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass-card p-8 text-center">
          <Loader size={24} className="animate-spin mx-auto mb-3" style={{ color: 'var(--accent-green)' }} />
          <div className="text-sm font-mono" style={{ color: 'var(--accent-green)' }}>RUNNING GRAPH ALGORITHMS...</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Detecting cycles, smurfing patterns, and shell chains</div>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Accounts Analyzed', value: results.summary.total_accounts_analyzed, color: '0,212,255' },
              { label: 'Fraud Rings', value: results.summary.fraud_rings_detected, color: '255,51,85' },
              { label: 'Suspicious Accounts', value: results.summary.suspicious_accounts_flagged, color: '255,140,0' },
              { label: 'Processing Time', value: `${results.summary.processing_time_seconds}s`, color: '0,255,136' },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass-card p-4 text-center">
                <div className="text-2xl font-bold font-mono" style={{ color: `rgb(${color})` }}>{value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Download button */}
          <div className="flex items-center gap-3">
            <button onClick={downloadJSON} className="btn-primary flex items-center gap-2">
              <Download size={14} /> Download JSON Report
            </button>
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
                  {tab === 'graph' ? 'Network Graph' : tab === 'rings' ? `Fraud Rings (${results.fraud_rings.length})` : `Suspicious Accounts (${results.suspicious_accounts.length})`}
                </button>
              ))}
            </div>

            <div style={{ height: 'calc(100% - 45px)', overflow: 'auto' }}>
              {activeTab === 'graph' && (
                <div style={{ height: '100%' }}>
                  <GraphView
                    graph={results.graph}
                    suspiciousAccounts={results.suspicious_accounts}
                    fraudRings={results.fraud_rings}
                  />
                </div>
              )}

              {activeTab === 'rings' && (
                <div className="p-4">
                  <RingTable rings={results.fraud_rings} />
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
                      {results.suspicious_accounts.map((acc, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(26,51,84,0.5)' }} className="hover:bg-opacity-50">
                          <td className="py-2 px-3 font-mono" style={{ color: 'var(--accent-blue)' }}>{acc.account_id}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded font-medium ${getRiskClass(acc.suspicion_score)}`}>
                              {acc.suspicion_score}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono" style={{ color: 'var(--accent-orange)' }}>{acc.ring_id}</td>
                          <td className="py-2 px-3" style={{ color: 'var(--text-muted)' }}>
                            {acc.detected_patterns.join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
