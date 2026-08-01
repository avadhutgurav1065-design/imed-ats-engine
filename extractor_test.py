import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter # NEW: We import the Slicer tool

PDF_PATH = "uploads/avadhut.pdf"

def test_extractor_and_chunker():
    print("--- IMED AI PDF Extractor & Chunker Test ---")
    
    if not os.path.exists(PDF_PATH):
        print(f"❌ ERROR: I cannot find '{PDF_PATH}'.")
        return

    print(f"✅ Found the PDF! Ripping text from: {PDF_PATH}...\n")

    # PHASE 1: The Extractor (You already built this)
    loader = PyPDFLoader(PDF_PATH)
    pages = loader.load()
    print(f"📚 Total pages extracted: {len(pages)}")

    # PHASE 2: The Chunker (The Slicer)
    # We are telling the Slicer: "Cut the text into blocks of 500 characters."
    # "But overlap them by 100 characters so sentences don't get cut in half."
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=500, 
        chunk_overlap=100
    )
    
    # Now we pass the extracted pages into the Slicer
    chunks = text_splitter.split_documents(pages)
    
    print(f"🔪 Sliced the document into {len(chunks)} overlapping chunks.")

    # Let's preview just the first two chunks to see how the overlap works
    if len(chunks) > 1:
        print("\n--- CHUNK 1 PREVIEW ---")
        print(chunks[0].page_content)
        print("\n--- CHUNK 2 PREVIEW ---")
        print(chunks[1].page_content)
        print("\n-------------------------")
        print("✅ SUCCESS: The text is sliced and ready for the AI Translator!")

if __name__ == "__main__":
    test_extractor_and_chunker()