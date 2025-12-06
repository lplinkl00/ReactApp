# charity_rag_server.py
import os
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import lancedb
from sentence_transformers import SentenceTransformer
from backend.charity_rag_core import load_json_data, build_campaign_graph, query_graph_rag
import re

# Optional Gemini (if installed and configured)
try:
    import google.generativeai as genai
    HAVE_GENAI = True
except Exception:
    genai = None
    HAVE_GENAI = False

JSON_PATH = os.getenv('CHARITY_JSON_PATH', './Data processing/cleaned_data.json')
DB_PATH = os.getenv('CHARITY_DB_PATH', './lancedb_charity_gemini_rag')
TABLE_NAME = os.getenv('CHARITY_TABLE', 'charity_chunks')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

# load resources once
print('[server] connecting to LanceDB...')
db = lancedb.connect(DB_PATH)
table = db.open_table(TABLE_NAME)
print('[server] loading json data and graph...')
data = load_json_data(JSON_PATH)
G = build_campaign_graph(data)
print('[server] loading embedder...')
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# simple local intent detector fallback

def detect_intent_local(text: str) -> str:
    t = text.lower()
    # donation keywords
    if re.search(r"\bdonat|\bdonate|\brm\b|\bpay\b|\btransfer\b", t):
        return 'DONATE'
    # question keywords
    if any(w in t for w in ['?', 'which', 'what', 'who', 'where', 'how', 'when']):
        return 'QUERY'
    return 'OTHER'


def extract_amount_local(text: str) -> str:
    # try to find patterns like RM 50 or RM50 or 50 ringgit
    m = re.search(r"rm\s*([0-9]+)", text.lower())
    if m:
        return f"RM {m.group(1)}"
    m2 = re.search(r"([0-9]+)\s*(ringgit|rm)\b", text.lower())
    if m2:
        return f"RM {m2.group(1)}"
    # fallback
    return 'RM 40'


# charity_rag_server.py
import os
from fastapi import FastAPI
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import lancedb
from sentence_transformers import SentenceTransformer
from backend.charity_rag_core import load_json_data, build_campaign_graph, query_graph_rag
import re

# Optional Gemini (if installed and configured)
try:
    import google.generativeai as genai
    HAVE_GENAI = True
except Exception:
    genai = None
    HAVE_GENAI = False

JSON_PATH = os.getenv('CHARITY_JSON_PATH', './Data processing/cleaned_data.json')
DB_PATH = os.getenv('CHARITY_DB_PATH', './lancedb_charity_gemini_rag')
TABLE_NAME = os.getenv('CHARITY_TABLE', 'charity_chunks')

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    question: str

# load resources once
print('[server] connecting to LanceDB...')
db = lancedb.connect(DB_PATH)
table = db.open_table(TABLE_NAME)
print('[server] loading json data and graph...')
data = load_json_data(JSON_PATH)
G = build_campaign_graph(data)
print('[server] loading embedder...')
embedder = SentenceTransformer('all-MiniLM-L6-v2')

# simple local intent detector fallback

def detect_intent_local(text: str) -> str:
    t = text.lower()
    # donation keywords
    if re.search(r"\bdonat|\bdonate|\brm\b|\bpay\b|\btransfer\b", t):
        return 'DONATE'
    # question keywords
    if any(w in t for w in ['?', 'which', 'what', 'who', 'where', 'how', 'when']):
        return 'QUERY'
    return 'OTHER'


def extract_amount_local(text: str) -> str:
    # try to find patterns like RM 50 or RM50 or 50 ringgit
    m = re.search(r"rm\s*([0-9]+)", text.lower())
    if m:
        return f"RM {m.group(1)}"
    m2 = re.search(r"([0-9]+)\s*(ringgit|rm)\b", text.lower())
    if m2:
        return f"RM {m2.group(1)}"
    # fallback
    return 'RM 40'


@app.post('/chat')
async def chat(req: QueryRequest):
    user_input = req.question.strip()
    intent = detect_intent_local(user_input)

    if intent == 'DONATE':
        amt = extract_amount_local(user_input)
        return {
            'reply': f"✅ Your donation of {amt} has been recorded (simulated). Thank you!",
            'intent': 'DONATE'
        }

    elif intent == 'QUERY':
        context = query_graph_rag(user_input, table, embedder, G, data, top_k=3)
        if not context.strip():
            return {
                'reply': "I couldn't find relevant context from the data.",
                'intent': 'QUERY',
                'context': ''
            }

        # If Gemini available and configured, call it
        if HAVE_GENAI and os.getenv('GEMINI_API_KEY'):
            try:
                genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
                model = genai.GenerativeModel('gemini-2.5-flash')
                prompt = f"""Use ONLY the context below to answer the question.

Context:
{context}

Question:
{user_input}

Answer in clear, concise sentences."""
                response = model.generate_content(prompt)
                reply_text = response.text.strip()
            except Exception as e:
                print(f"[Gemini error] {e}")
                reply_text = f"Here's the context I found:\n{context}"
        else:
            # fallback simple template reply
            reply_text = f"Based on the data I have:\n{context}"

        return {
            'reply': reply_text,
            'intent': 'QUERY',
            'context': context
        }

    else:
        return {
            'reply': "I'm here to help with donations or answering questions about campaigns. How can I assist?",
            'intent': 'OTHER'
        }
