# charity_rag_setup.py
import argparse
from backend.charity_rag_core import load_json_data, build_dataframe, chunk_texts, embed_texts, create_lancedb_table

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', type=str, default='./Data processing/cleaned_data.json')
    parser.add_argument('--db', type=str, default='./lancedb_charity_gemini_rag')
    parser.add_argument('--table', type=str, default='charity_chunks')
    parser.add_argument('--chunk-size', type=int, default=300)
    parser.add_argument('--chunk-overlap', type=int, default=40)
    parser.add_argument('--embed-model', type=str, default='all-MiniLM-L6-v2')
    args = parser.parse_args()

    print('[setup] loading data ...')
    data = load_json_data(args.json)
    df = build_dataframe(data)

    print('[setup] chunking ...')
    chunks = chunk_texts(df, data, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)
    print(f'[setup] {len(chunks)} chunks produced')

    print('[setup] embedding ... (this may take time)')
    chunks_with_embeddings, embedder = embed_texts(chunks, model_name=args.embed_model)

    print('[setup] storing in lancedb ...')
    db, table = create_lancedb_table(args.db, args.table, chunks_with_embeddings, overwrite=True)

    print('\n✅ Setup complete. LanceDB table is ready at:', args.db)