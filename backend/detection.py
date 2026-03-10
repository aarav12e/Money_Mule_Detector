import networkx as nx
import pandas as pd
from collections import defaultdict
from datetime import timedelta

# ─── CYCLE DETECTION (Circular Fund Routing) ────────────────────────────────

def find_cycles(G):
    """Detect all cycles of length 3–5 using DFS."""
    cycles_found = []
    try:
        all_cycles = list(nx.simple_cycles(G))
        for cycle in all_cycles:
            if 3 <= len(cycle) <= 5:
                cycles_found.append(cycle)
    except Exception:
        pass
    return cycles_found


# ─── SMURFING (Fan-in / Fan-out) ─────────────────────────────────────────────

def find_smurfing(G, df, threshold=10, time_window_hours=72):
    """Detect fan-in (many→one) and fan-out (one→many) within 72hr windows."""
    smurfing_nodes = defaultdict(list)
    df_copy = df.copy()
    df_copy["timestamp"] = pd.to_datetime(df_copy["timestamp"])

    for node in G.nodes():
        in_degree = G.in_degree(node)
        out_degree = G.out_degree(node)

        # Fan-in: 10+ senders → 1 receiver
        if in_degree >= threshold:
            senders = list(G.predecessors(node))
            # Check temporal clustering
            node_txns = df_copy[df_copy["receiver_id"].astype(str) == str(node)]["timestamp"]
            if len(node_txns) >= threshold:
                time_range = node_txns.max() - node_txns.min()
                if time_range <= timedelta(hours=time_window_hours):
                    smurfing_nodes[node].append("fan_in_temporal")
                else:
                    smurfing_nodes[node].append("fan_in")

        # Fan-out: 1 sender → 10+ receivers
        if out_degree >= threshold:
            receivers = list(G.successors(node))
            node_txns = df_copy[df_copy["sender_id"].astype(str) == str(node)]["timestamp"]
            if len(node_txns) >= threshold:
                time_range = node_txns.max() - node_txns.min()
                if time_range <= timedelta(hours=time_window_hours):
                    smurfing_nodes[node].append("fan_out_temporal")
                else:
                    smurfing_nodes[node].append("fan_out")

    return dict(smurfing_nodes)


# ─── SHELL CHAIN DETECTION ────────────────────────────────────────────────────

def find_shell_chains(G, df, min_chain_length=3, max_txn_count=3):
    """Detect layered shell networks: chains of low-activity intermediate accounts."""
    # Count total transactions per account
    txn_counts = defaultdict(int)
    for _, row in df.iterrows():
        txn_counts[str(row["sender_id"])] += 1
        txn_counts[str(row["receiver_id"])] += 1

    shell_accounts = {n for n, c in txn_counts.items() if c <= max_txn_count}
    shell_chains = []

    visited_chains = set()
    for node in G.nodes():
        if node in shell_accounts:
            continue  # Start from non-shell nodes
        # DFS forward through shell intermediaries
        def dfs_shell(current, chain, depth):
            if depth > 6:
                return
            for succ in G.successors(current):
                if succ in shell_accounts and succ not in chain:
                    new_chain = chain + [succ]
                    if len(new_chain) >= min_chain_length - 1:
                        chain_key = tuple(sorted(new_chain))
                        if chain_key not in visited_chains:
                            visited_chains.add(chain_key)
                            shell_chains.append([node] + new_chain)
                    dfs_shell(succ, new_chain, depth + 1)
        dfs_shell(node, [], 0)

    return shell_chains


# ─── MAIN DETECTION ORCHESTRATOR ─────────────────────────────────────────────

def detect_fraud_rings(G, df):
    rings = []
    ring_counter = 1
    seen_members = set()

    # 1. Cycle-based rings
    cycles = find_cycles(G)
    for cycle in cycles:
        members = [str(a) for a in cycle]
        key = frozenset(members)
        if key in seen_members:
            continue
        seen_members.add(key)
        ring_id = f"RING_{ring_counter:03d}"
        ring_counter += 1
        rings.append({
            "ring_id": ring_id,
            "member_accounts": members,
            "pattern_type": f"cycle_length_{len(cycle)}",
            "risk_score": round(min(95 + (5 - len(cycle)) * 2, 99), 1)
        })

    # 2. Smurfing rings
    smurfing = find_smurfing(G, df)
    for node, patterns in smurfing.items():
        ring_id = f"RING_{ring_counter:03d}"
        ring_counter += 1
        pattern = patterns[0]
        if "fan_in" in pattern:
            members = [str(node)] + [str(p) for p in list(G.predecessors(node))[:20]]
        else:
            members = [str(node)] + [str(s) for s in list(G.successors(node))[:20]]
        key = frozenset(members)
        if key in seen_members:
            continue
        seen_members.add(key)
        rings.append({
            "ring_id": ring_id,
            "member_accounts": members,
            "pattern_type": pattern,
            "risk_score": round(70 + min(len(members) * 0.5, 25), 1)
        })

    # 3. Shell chain rings
    shell_chains = find_shell_chains(G, df)
    for chain in shell_chains:
        members = [str(a) for a in chain]
        key = frozenset(members)
        if key in seen_members:
            continue
        seen_members.add(key)
        ring_id = f"RING_{ring_counter:03d}"
        ring_counter += 1
        rings.append({
            "ring_id": ring_id,
            "member_accounts": members,
            "pattern_type": f"shell_chain_{len(chain)}_hops",
            "risk_score": round(60 + len(chain) * 5, 1)
        })

    return rings


# ─── SUSPICION SCORE COMPUTATION ─────────────────────────────────────────────

def compute_suspicion_scores(G, df, fraud_rings):
    account_to_rings = defaultdict(list)
    for ring in fraud_rings:
        for acc in ring["member_accounts"]:
            account_to_rings[acc].append(ring["ring_id"])

    txn_counts = defaultdict(int)
    amounts = defaultdict(float)
    for _, row in df.iterrows():
        s, r = str(row["sender_id"]), str(row["receiver_id"])
        txn_counts[s] += 1
        txn_counts[r] += 1
        amounts[s] += float(row["amount"])
        amounts[r] += float(row["amount"])

    suspicious = []
    for account, ring_ids in account_to_rings.items():
        patterns = []
        score = 0.0

        # Ring membership base score
        score += min(len(ring_ids) * 20, 40)

        # Cycle detection
        ring_patterns = []
        for rid in ring_ids:
            ring = next((r for r in fraud_rings if r["ring_id"] == rid), None)
            if ring:
                ring_patterns.append(ring["pattern_type"])
        patterns.extend(ring_patterns)

        # Velocity
        if txn_counts[account] > 50:
            patterns.append("high_velocity")
            score += 15
        elif txn_counts[account] > 20:
            patterns.append("medium_velocity")
            score += 8

        # High amount
        if amounts[account] > 100000:
            patterns.append("high_value")
            score += 10

        # Degree anomaly
        in_d = G.in_degree(account)
        out_d = G.out_degree(account)
        if in_d >= 10:
            patterns.append("fan_in")
            score += 15
        if out_d >= 10:
            patterns.append("fan_out")
            score += 15

        score = min(round(score, 1), 100.0)
        suspicious.append({
            "account_id": account,
            "suspicion_score": score,
            "detected_patterns": list(set(patterns)),
            "ring_id": ring_ids[0] if ring_ids else "UNKNOWN"
        })

    suspicious.sort(key=lambda x: x["suspicion_score"], reverse=True)
    return suspicious
