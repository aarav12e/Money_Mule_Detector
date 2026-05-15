from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import pandas as pd
import networkx as nx
import io, time, json
from datetime import datetime, timedelta
from typing import Optional
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import bcrypt
import jwt
from dotenv import load_dotenv
from detection import detect_fraud_rings, compute_suspicion_scores

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey123")
JWT_EXPIRE_HOURS = 24

client = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global client, db
    client = AsyncIOMotorClient(MONGO_URL)
    db = client["money_mule_detector"]
    await db["users"].create_index("email", unique=True)
    yield
    client.close()

app = FastAPI(title="Money Mule Detector API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer(auto_error=False)

def create_token(user_id: str, email: str):
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")

def verify_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload

def serialize(obj):
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

# ─── AUTH ROUTES ────────────────────────────────────────────────────────────

@app.post("/auth/register")
async def register(data: dict):
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    name = data.get("name", "")
    if not email or not password:
        raise HTTPException(400, "Email and password required")
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        result = await db["users"].insert_one({
            "email": email, "name": name,
            "password": hashed, "created_at": datetime.utcnow()
        })
        token = create_token(str(result.inserted_id), email)
        return {"token": token, "user": {"email": email, "name": name}}
    except Exception:
        raise HTTPException(400, "Email already registered")

@app.post("/auth/login")
async def login(data: dict):
    email = data.get("email", "").lower().strip()
    password = data.get("password", "")
    user = await db["users"].find_one({"email": email})
    if not user or not bcrypt.checkpw(password.encode(), user["password"].encode()):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(str(user["_id"]), email)
    return {"token": token, "user": {"email": email, "name": user.get("name", "")}}

@app.get("/auth/me")
async def me(current_user=Depends(get_current_user)):
    return current_user

# ─── ANALYSIS ROUTES ────────────────────────────────────────────────────────

@app.post("/analyze")
async def analyze(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    start = time.time()
    content = await file.read()
    try:
        if file.filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(400, f"File parse error: {e}")

    required = {"transaction_id", "sender_id", "receiver_id", "amount", "timestamp"}
    if not required.issubset(df.columns):
        raise HTTPException(400, f"Missing columns. Required: {required}")

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["amount"] = pd.to_numeric(df["amount"], errors="coerce").fillna(0)

    # Build directed graph
    G = nx.DiGraph()
    for _, row in df.iterrows():
        s, r = str(row["sender_id"]), str(row["receiver_id"])
        G.add_node(s)
        G.add_node(r)
        if G.has_edge(s, r):
            G[s][r]["amount"] += float(row["amount"])
            G[s][r]["count"] += 1
            G[s][r]["transactions"].append(row["transaction_id"])
        else:
            G.add_edge(s, r, amount=float(row["amount"]), count=1, transactions=[row["transaction_id"]])

    fraud_rings = detect_fraud_rings(G, df)
    suspicious_accounts = compute_suspicion_scores(G, df, fraud_rings)
    elapsed = round(time.time() - start, 2)

    # Build edges for frontend
    edges = []
    for u, v, d in G.edges(data=True):
        edges.append({"source": u, "target": v, "amount": d["amount"], "count": d["count"]})

    summary = {
        "total_accounts_analyzed": G.number_of_nodes(),
        "suspicious_accounts_flagged": len(suspicious_accounts),
        "fraud_rings_detected": len(fraud_rings),
        "processing_time_seconds": elapsed
    }

    result_doc = {
        "user_id": current_user["user_id"],
        "filename": file.filename,
        "uploaded_at": datetime.utcnow(),
        "summary": summary,
        "suspicious_accounts": suspicious_accounts,
        "fraud_rings": fraud_rings,
        "graph": {
            "nodes": list(G.nodes()),
            "edges": edges
        },
        "csv_row_count": len(df)
    }

    inserted = await db["analyses"].insert_one(result_doc)
    analysis_id = str(inserted.inserted_id)

    return {
        "analysis_id": analysis_id,
        "suspicious_accounts": suspicious_accounts,
        "fraud_rings": fraud_rings,
        "graph": result_doc["graph"],
        "summary": summary
    }

# ─── HISTORY ROUTES ─────────────────────────────────────────────────────────

@app.get("/history")
async def get_history(current_user=Depends(get_current_user)):
    cursor = db["analyses"].find(
        {"user_id": current_user["user_id"]},
        {"suspicious_accounts": 0, "fraud_rings": 0, "graph": 0}
    ).sort("uploaded_at", -1).limit(50)
    results = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        results.append(doc)
    return results

@app.get("/history/{analysis_id}")
async def get_analysis(analysis_id: str, current_user=Depends(get_current_user)):
    try:
        doc = await db["analyses"].find_one({
            "_id": ObjectId(analysis_id),
            "user_id": current_user["user_id"]
        })
    except:
        raise HTTPException(400, "Invalid ID")
    if not doc:
        raise HTTPException(404, "Analysis not found")
    doc["_id"] = str(doc["_id"])
    return doc

@app.delete("/history/{analysis_id}")
async def delete_analysis(analysis_id: str, current_user=Depends(get_current_user)):
    try:
        await db["analyses"].delete_one({
            "_id": ObjectId(analysis_id),
            "user_id": current_user["user_id"]
        })
    except:
        raise HTTPException(400, "Invalid ID")
    return {"deleted": True}

@app.get("/health")
async def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}
