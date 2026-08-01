import os
import streamlit as st
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

# 1. Configuration - Securely pulling from .streamlit/secrets.toml
DB_PATH = "chroma_db"
try:
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
except Exception:
    print("⚠️ WARNING: Gemini API Key not found in secrets. Using placeholder.")
    GEMINI_API_KEY = "PLACEHOLDER_KEY"

def run_agent():
    print("--- IMED AI Agent Booting Up ---")
    
    # 2. Wake up the Database & Retriever
    embeddings = FastEmbedEmbeddings()
    db = Chroma(persist_directory=DB_PATH, embedding_function=embeddings)
    # k=3 means "pull the top 3 most relevant chunks of text"
    retriever = db.as_retriever(search_kwargs={"k": 3})
    
    # 3. Wake up the Brain (Gemini 3.6 Flash)
    print("🧠 Connecting to the Gemini Brain...")
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.3 # Low temperature means it stays factual and doesn't hallucinate
    )
    
    # 4. Give the Brain its Personality and Instructions
    system_prompt = (
        "You are a helpful, professional AI assistant built by Avadhut for IMED college. "
        "Use the following pieces of retrieved context to answer the user's question. "
        "If the answer is not in the context, just say 'I don't have information on that.' "
        "Do not make up information. Keep your answer clear and concise.\n\n"
        "Context: {context}"
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "{input}"),
    ])
    
    # 5. Wire the Brain and the Database together into one Pipeline
    question_answer_chain = create_stuff_documents_chain(llm, prompt)
    rag_chain = create_retrieval_chain(retriever, question_answer_chain)
    
    # 6. Test the Agent!
    query = "Based on the document, what backend framework does the candidate use?"
    print(f"\n🗣️ YOU: {query}")
    print("🤖 AI IS THINKING...\n")
    
    # This sends the question to the Retriever, gets the chunks, sends them to Gemini, and prints the result
    response = rag_chain.invoke({"input": query})
    
    print(f"✅ FINAL ANSWER: {response['answer']}")

if __name__ == "__main__":
    run_agent()