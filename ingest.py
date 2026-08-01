import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
# 1. We import FastEmbed instead of HuggingFace
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings 
from langchain_community.vectorstores import Chroma

PDF_PATH = "uploads/avadhut.pdf"
DB_PATH = "chroma_db" 

def build_local_database():
    print("--- IMED AI Data Engine Starting ---")
    
    print("1. Extracting and slicing document...")
    loader = PyPDFLoader(PDF_PATH)
    pages = loader.load()
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
    chunks = text_splitter.split_documents(pages)
    
    # 2. We use FastEmbed (Completely bypasses PyTorch and DLL errors)
    print("2. Firing up FastEmbed (Lightweight Laptop AI)...")
    embeddings = FastEmbedEmbeddings()
    
    print("3. Translating text to math and saving to local database...")
    db = Chroma.from_documents(chunks, embeddings, persist_directory=DB_PATH)
    
    print(f"✅ SUCCESS: Saved {len(chunks)} data chunks into the local ChromaDB!")
    print("Your data engine is 100% complete and fully offline.")

if __name__ == "__main__":
    build_local_database()