import { useEffect, useRef, useState } from 'react'
import cytoscape from 'cytoscape'

export default function GraphView({ graph, suspiciousAccounts, fraudRings }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [stats, setStats] = useState({ nodes: 0, edges: 0 })

  useEffect(() => {
    if (!containerRef.current || !graph) return

    const suspiciousSet = new Set(suspiciousAccounts.map(a => a.account_id))
    const ringMemberMap = {}
    fraudRings.forEach(ring => {
      ring.member_accounts.forEach(acc => {
        ringMemberMap[acc] = ring.ring_id
      })
    })

    // Score map for color intensity
    const scoreMap = {}
    suspiciousAccounts.forEach(a => { scoreMap[a.account_id] = a.suspicion_score })

    const nodes = graph.nodes.map(id => {
      const isSuspicious = suspiciousSet.has(id)
      const score = scoreMap[id] || 0
      let color = '#1a3354'
      let borderColor = '#2a4a6a'
      let size = 28

      if (isSuspicious) {
        if (score >= 90) { color = 'rgba(255,51,85,0.25)'; borderColor = '#ff3355'; size = 44 }
        else if (score >= 70) { color = 'rgba(255,140,0,0.2)'; borderColor = '#ff8c00'; size = 38 }
        else if (score >= 50) { color = 'rgba(255,200,0,0.2)'; borderColor = '#ffc800'; size = 34 }
        else { color = 'rgba(0,212,255,0.15)'; borderColor = '#00d4ff'; size = 30 }
      }

      return {
        data: {
          id,
          label: id.length > 10 ? id.slice(0, 8) + '..' : id,
          fullId: id,
          isSuspicious,
          score,
          ring: ringMemberMap[id] || null,
          color,
          borderColor,
          size
        }
      }
    })

    // Limit edges for performance
    const maxEdges = 500
    const edges = graph.edges.slice(0, maxEdges).map((e, i) => ({
      data: {
        id: `e${i}`,
        source: e.source,
        target: e.target,
        amount: e.amount,
        count: e.count,
        label: `$${Math.round(e.amount).toLocaleString()}`
      }
    }))

    if (cyRef.current) cyRef.current.destroy()

    const cy = cytoscape({
      container: containerRef.current,
      elements: [...nodes, ...edges],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            'border-color': 'data(borderColor)',
            'border-width': 2,
            'width': 'data(size)',
            'height': 'data(size)',
            'label': 'data(label)',
            'color': '#e2f0ff',
            'font-size': '9px',
            'font-family': 'JetBrains Mono',
            'text-valign': 'bottom',
            'text-margin-y': 4,
            'text-outline-width': 2,
            'text-outline-color': '#050a0e',
          }
        },
        {
          selector: 'node[isSuspicious = true]',
          style: {
            'border-width': 3,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': 'rgba(90,122,153,0.4)',
            'target-arrow-color': 'rgba(90,122,153,0.4)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.8,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#00ff88',
            'border-width': 4,
            'background-color': 'rgba(0,255,136,0.2)',
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#00ff88',
            'target-arrow-color': '#00ff88',
            'width': 3,
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: false,
        randomize: false,
        nodeRepulsion: 8000,
        idealEdgeLength: 80,
        edgeElasticity: 0.45,
        gravity: 0.8,
        numIter: 1000,
      }
    })

    cy.on('tap', 'node', (evt) => {
      const node = evt.target
      setSelected({
        type: 'node',
        id: node.data('fullId'),
        score: node.data('score'),
        isSuspicious: node.data('isSuspicious'),
        ring: node.data('ring'),
        inDegree: node.indegree(),
        outDegree: node.outdegree(),
      })
    })

    cy.on('tap', 'edge', (evt) => {
      const edge = evt.target
      setSelected({
        type: 'edge',
        source: edge.data('source'),
        target: edge.data('target'),
        amount: edge.data('amount'),
        count: edge.data('count'),
      })
    })

    cy.on('tap', (evt) => {
      if (evt.target === cy) setSelected(null)
    })

    cyRef.current = cy
    setStats({ nodes: nodes.length, edges: edges.length })

    return () => { if (cyRef.current) cyRef.current.destroy() }
  }, [graph, suspiciousAccounts, fraudRings])

  const fitGraph = () => cyRef.current?.fit()
  const centerGraph = () => cyRef.current?.center()

  return (
    <div className="relative w-full h-full">
      {/* Graph */}
      <div ref={containerRef} style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)' }} />

      {/* Controls */}
      <div className="absolute top-3 left-3 flex gap-2">
        <button onClick={fitGraph} className="btn-ghost text-xs px-2 py-1">Fit</button>
        <button onClick={centerGraph} className="btn-ghost text-xs px-2 py-1">Center</button>
      </div>

      {/* Stats */}
      <div className="absolute top-3 right-3 flex gap-2">
        <div className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'rgba(10,22,40,0.9)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {stats.nodes} nodes · {stats.edges} edges
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 glass-card p-3 flex flex-col gap-1.5" style={{ fontSize: '10px', minWidth: 160 }}>
        <div className="font-mono mb-1" style={{ color: 'var(--text-muted)' }}>RISK LEVEL</div>
        {[
          { color: '#ff3355', label: 'Critical (90+)' },
          { color: '#ff8c00', label: 'High (70–89)' },
          { color: '#ffc800', label: 'Medium (50–69)' },
          { color: '#00d4ff', label: 'Low (<50)' },
          { color: '#2a4a6a', label: 'Clean' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: color, background: `${color}30` }} />
            <span style={{ color: 'var(--text-muted)' }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Selected node info */}
      {selected && (
        <div className="absolute bottom-3 right-3 glass-card p-4" style={{ minWidth: 220, maxWidth: 280 }}>
          {selected.type === 'node' ? (
            <>
              <div className="text-xs font-mono mb-2" style={{ color: 'var(--accent-blue)' }}>ACCOUNT DETAILS</div>
              <div className="font-mono text-sm font-bold mb-3 break-all" style={{ color: 'var(--text-primary)' }}>{selected.id}</div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Suspicion Score</span>
                  <span className={`font-bold ${selected.score >= 70 ? 'text-accent-red' : selected.score >= 40 ? 'text-accent-orange' : 'text-accent-green'}`}>
                    {selected.score || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Status</span>
                  <span style={{ color: selected.isSuspicious ? '#ff3355' : '#00ff88' }}>
                    {selected.isSuspicious ? 'SUSPICIOUS' : 'CLEAN'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Ring</span>
                  <span style={{ color: 'var(--accent-orange)' }}>{selected.ring || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>In / Out</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selected.inDegree} / {selected.outDegree}</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-mono mb-2" style={{ color: 'var(--accent-blue)' }}>TRANSACTION</div>
              <div className="flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>From</span>
                  <span className="font-mono text-xs break-all" style={{ color: 'var(--text-primary)', maxWidth: 130 }}>{selected.source}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>To</span>
                  <span className="font-mono text-xs break-all" style={{ color: 'var(--text-primary)', maxWidth: 130 }}>{selected.target}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                  <span style={{ color: 'var(--accent-green)' }}>${selected.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Transactions</span>
                  <span style={{ color: 'var(--text-primary)' }}>{selected.count}</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
