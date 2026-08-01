import os
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma

DB_PATH = "chroma_db"

def test_retriever():
    print("--- IMED AI Search Engine Test ---")
    
    # 1. Wake up the Translator (Must be the exact same one we used to save the data)
    print("1. Waking up FastEmbed...")
    embeddings = FastEmbedEmbeddings()
    
    # 2. Connect to your local Filing Cabinet
    print("2. Connecting to local ChromaDB...")
    db = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
    
    # 3. Create the Retriever (The Librarian)
    # search_kwargs={"k": 2} means "bring me the top 2 most relevant chunks of text"
    retriever = db.as_retriever(search_kwargs={"k": 2})
    
    # 4. Ask a question! 
    # (We are asking a specific question to see if it finds your technical skills)
    query = "What programming languages and technical skills does the candidate know?"
    print(f"\n🔍 SEARCHING FOR: '{query}'")
    
    # 5. Fetch the results from the database
    results = retriever.invoke(query)
    
    print(f"\n✅ Found {len(results)} matching chunks! Here is what the database pulled:\n")
    
    # 6. Print out the text it found
    for i, doc in enumerate(results):
        print(f"--- MATCHING CHUNK {i+1} ---")
        print(doc.page_content)
        print("---------------------------\n")

if __name__ == "__main__":
    test_retriever()