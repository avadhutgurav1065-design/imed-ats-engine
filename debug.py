import google.generativeai as genai
import streamlit as st
import sys

# 1. Pull the API key directly from your unified Streamlit secrets
try:
    api_key = st.secrets["GEMINI_API_KEY"]
except Exception:
    print("\n🚨 CRITICAL ERROR: Gemini API Key not found in .streamlit/secrets.toml!")
    print("Please add it or check your file path before running diagnostics.")
    sys.exit(1)  # Terminate the script immediately if no key is found

# 2. Configure the Google connection
genai.configure(api_key=api_key)

print("\n📡 Connecting to Google's servers to check your specific key permissions...")

try:
    available_models = False
    print("\n--- YOUR UNLOCKED MODELS ---")
    
    # 3. Ask Google for a list of every model this key is legally allowed to use
    for model in genai.list_models():
        if 'generateContent' in model.supported_generation_methods:
            # We strip out the "models/" prefix so you can copy-paste the exact name
            clean_name = model.name.replace('models/', '')
            print(f"✅ {clean_name}")
            available_models = True
            
    if not available_models:
        print("\n🚨 Google says this key has no text models available! (The key might be restricted).")
        
except Exception as e:
    print(f"\n🚨 Connection Failed! The server rejected the key. Error: {e}")