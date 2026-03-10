function getRiskClass(score) {
  if (score >= 90) return 'risk-critical'
  if (score >= 70) return 'risk-high'
  if (score >= 50) return 'risk-medium'
  return 'risk-low'
}

export default function RingTable({ rings }) {
  if (!rings?.length) return (
    <div className="text-center py-8 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
      NO FRAUD RINGS DETECTED
    </div>
  )

  return (
    <div className="flex flex-col gap-3">
      {rings.map(ring => (
        <div key={ring.ring_id} className="rounded-lg p-4" style={{ background: 'rgba(255,51,85,0.05)', border: '1px solid rgba(255,51,85,0.2)' }}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="font-mono text-sm font-bold" style={{ color: '#ff3355' }}>{ring.ring_id}</div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRiskClass(ring.risk_score)}`}>
                Risk: {ring.risk_score}
              </span>
            </div>
            <div className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(0,212,255,0.2)' }}>
              {ring.member_accounts.length} members
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pattern:</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(255,140,0,0.1)', color: '#ff8c00', border: '1px solid rgba(255,140,0,0.2)' }}>
              {ring.pattern_type}
            </span>
          </div>
          <div>
            <div className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Member Accounts:</div>
            <div className="flex flex-wrap gap-1.5">
              {ring.member_accounts.map(acc => (
                <span key={acc} className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(26,51,84,0.8)', color: 'var(--accent-blue)', border: '1px solid var(--border)' }}>
                  {acc}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
