# charity_rag_core.py
import os
import json
from typing import List, Dict
import pandas as pd

# Minimal text splitter fallback
class RecursiveCharacterTextSplitter:
    def __init__(self, chunk_size=300, chunk_overlap=40):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def split_text(self, text: str) -> List[str]:
        chunks = []
        i = 0
        step = max(1, self.chunk_size - self.chunk_overlap)
        while i < len(text):
            chunks.append(text[i:i + self.chunk_size])
            i += step
        return chunks

# Data loaders / dataframe builders

def load_json_data(json_path: str) -> List[Dict]:
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"JSON file not found: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("Expected JSON root to be a list of items.")
    return data


def build_dataframe(data: List[Dict]) -> pd.DataFrame:
    rows = []
    for item in data:
        text = (
            f"Charity: {item.get('charity_name')}\n"
            f"Campaign: {item.get('campaign_title')}\n"
            f"Collected: {item.get('money_collected')}\n"
            f"Goal: {item.get('goal')}\n"
            f"URL: {item.get('url')}\n"
            f"Location: {item.get('location')}"
        )
        rows.append(text)
    df = pd.DataFrame({"text": rows})
    return df


def chunk_texts(df: pd.DataFrame, original_data: List[Dict],
                chunk_size: int = 300, chunk_overlap: int = 40):
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = []
    for idx, txt in enumerate(df['text']):
        pieces = splitter.split_text(txt)
        for p in pieces:
            chunks.append({"text": p, "source_id": idx})
    return chunks

# Embedding helper (keeps minimal responsibility)
from sentence_transformers import SentenceTransformer

def embed_texts(chunks: List[Dict], model_name: str = "all-MiniLM-L6-v2"):
    embedder = SentenceTransformer(model_name)
    texts = [c["text"] for c in chunks]
    print(f"[embed] encoding {len(texts)} chunks with {model_name} ...")
    embeddings = embedder.encode(texts, show_progress_bar=True)
    # convert to plain lists
    processed = []
    for c, e in zip(chunks, embeddings):
        vec = e.tolist() if hasattr(e, "tolist") else list(e)
        processed.append({"text": c["text"], "source_id": int(c["source_id"]), "embedding": vec})
    return processed, embedder

# LanceDB helpers
import lancedb

def create_lancedb_table(db_path: str, table_name: str, chunks: List[Dict], overwrite: bool = True):
    db = lancedb.connect(db_path)
    data_to_store = [{"text": c["text"], "embedding": c["embedding"], "source_id": int(c["source_id"])} for c in chunks]
    table = db.create_table(table_name, data=data_to_store, mode="overwrite" if overwrite else "append")
    print(f"[lancedb] table '{table_name}' created at {db_path} ({len(data_to_store)} rows).")
    return db, table

# Graph builder
import networkx as nx

def build_campaign_graph(data: List[Dict]) -> nx.Graph:
    G = nx.Graph()
    for i, item in enumerate(data):
        campaign = (item.get("campaign_title") or "").strip()
        charity = (item.get("charity_name") or "").strip()
        G.add_node(i, charity=charity, campaign=campaign)
    for i in range(len(data)):
        campaign_i = (data[i].get("campaign_title") or "").strip()
        first_i = campaign_i.split(" ")[0] if campaign_i else None
        if not first_i:
            continue
        for j in range(i):
            campaign_j = (data[j].get("campaign_title") or "").strip()
            first_j = campaign_j.split(" ")[0] if campaign_j else None
            if first_j and first_i == first_j:
                G.add_edge(i, j, relation="similar_campaign")
    print(f"[graph] built graph with {G.number_of_nodes()} nodes and {G.number_of_edges()} edges.")
    return G

# RAG query helper

def query_graph_rag(question: str, table, embedder, G: nx.Graph, original_data: List[Dict], top_k: int = 3) -> str:
    # embed the query
    q_emb = embedder.encode([question])[0].tolist()
    # search
    results = table.search(q_emb).limit(top_k).to_pandas()
    if results.empty:
        return ""
    graph_context = []
    if "source_id" in results.columns:
        for sid in results["source_id"].astype(int).tolist():
            for neighbor in G.neighbors(int(sid)):
                node = G.nodes[neighbor]
                graph_context.append(f"{node.get('charity')} - {node.get('campaign')}")
    else:
        for idx in results.index:
            node_id = int(idx) % len(original_data)
            for neighbor in G.neighbors(node_id):
                node = G.nodes[neighbor]
                graph_context.append(f"{node.get('charity')} - {node.get('campaign')}")
    context = "\n".join(list(results['text']) + graph_context)
    return context