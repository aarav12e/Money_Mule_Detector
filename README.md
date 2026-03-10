# FinForge — Money Mule Detection Engine

> Graph-based financial crime detection for the RIFT 2026 Hackathon

## Live Demo
- **Frontend:** https://your-app.vercel.app
- **Backend API:** https://your-backend.onrender.com

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Graph Visualization | Cytoscape.js |
| Backend | Python FastAPI |
| Graph Algorithms | NetworkX + Pandas |
| Database | MongoDB Atlas (via Motor async) |
| Auth | JWT + bcrypt |
| Frontend Deploy | Vercel |
| Backend Deploy | Render.com |

---

## System Architecture

```
User (Browser)
    ↓ Upload CSV
React Frontend (Vercel)
    ↓ POST /analyze  (JWT Auth)
FastAPI Backend (Render)
    ├── Pandas: Parse CSV
    ├── NetworkX: Build DiGraph
    ├── Detection Engine:
    │     ├── Cycle Detection (DFS, len 3–5)
    │     ├── Smurfing (fan-in/fan-out, 72hr window)
    │     └── Shell Chain Detection (low-activity hops)
    ├── Suspicion Scoring (0–100)
    └── MongoDB Atlas: Persist results
    ↓ JSON response
React Frontend: Render graph + tables
```

---

## Algorithm Approach

### 1. Cycle Detection (Circular Fund Routing)
Uses `networkx.simple_cycles()` to find all directed cycles of length 3–5.  
**Complexity:** O(V + E) per cycle, total O((V+E) * C) where C = number of cycles  
**Risk score:** 95–99 (shorter cycles = higher risk)

### 2. Smurfing (Fan-in / Fan-out)
Counts in-degree and out-degree per node. Nodes with 10+ senders or 10+ receivers are flagged.  
Temporal analysis: transactions within a 72-hour window elevate the score.  
**Complexity:** O(V + E)

### 3. Shell Chain Detection
DFS traversal from non-shell source nodes through "shell" accounts (≤3 total transactions). Chains of 3+ hops are flagged.  
**Complexity:** O(V * D) where D = max depth (6)

---

## Suspicion Score Methodology

Each account starts at 0 and accumulates:
- `+20` per ring membership (capped at 40)
- `+15` for high velocity (50+ transactions)
- `+8` for medium velocity (20–49 transactions)
- `+10` for high-value transactions (>$100K)
- `+15` for fan-in pattern (10+ incoming)
- `+15` for fan-out pattern (10+ outgoing)

Final score is capped at 100. Accounts are sorted descending.

---

## Installation & Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Fill in MONGO_URL and JWT_SECRET
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_URL=http://localhost:8000
npm run dev
```

---

## Usage Instructions

1. Register an account at `/register`
2. Navigate to **Analyze**
3. Upload a CSV with columns: `transaction_id, sender_id, receiver_id, amount, timestamp`
4. Click **Run Analysis**
5. View the network graph — suspicious nodes are color-coded by risk
6. Download the JSON report
7. Access past analyses in **History**

---

## CSV Format

```csv
transaction_id,sender_id,receiver_id,amount,timestamp
TXN_001,ACC_001,ACC_002,5000.00,2024-01-15 10:30:00
TXN_002,ACC_002,ACC_003,4800.00,2024-01-15 11:00:00
TXN_003,ACC_003,ACC_001,4500.00,2024-01-15 12:00:00
```

---

## Known Limitations

- Graph visualization is limited to 500 edges for browser performance (full graph stored in DB)
- Cycle detection uses `simple_cycles()` which can be slow on very dense graphs (>5K edges)
- Shell chain detection DFS is capped at depth 6 to prevent stack overflow
- False positive mitigation: high-degree nodes are checked but payroll/merchant patterns are not yet specifically excluded

---

## Team Members
- [Your Name] — [Role]

---

## Hashtags
#RIFTHackathon #MoneyMulingDetection #FinancialCrime
