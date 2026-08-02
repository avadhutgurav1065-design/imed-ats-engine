import streamlit as st
import PyPDF2
import json
import re
from io import BytesIO
import pandas as pd
import numpy as np
import os
import csv
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import plotly.express as px
import plotly.graph_objects as go

# --- External PDF Engine ---
from pdf_engine import create_pdf_report

# ==============================================================================
# 1. PAGE CONFIGURATION & THEME
# ==============================================================================
st.set_page_config(
    page_title="IMED Placement Gap Analyzer",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

def apply_enterprise_ui():
    st.markdown("""
    <style>
        [data-testid="stSidebar"] { background-color: #0f172a !important; }
        [data-testid="stSidebar"] * { color: #f8fafc !important; }
        
        .glass-panel {
            background-color: var(--secondary-background-color);
            border: 1px solid rgba(150, 150, 150, 0.15);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
        }
        
        .stButton>button {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important;
            color: #FFFFFF !important;
            border: 1px solid #4f46e5 !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            transition: all 0.3s ease-in-out;
        }
        .stButton>button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.6) !important;
            border-color: #818cf8 !important;
        }
    </style>
    """, unsafe_allow_html=True)

apply_enterprise_ui()

# ==============================================================================
# 2. STATE & API CONFIGURATION
# ==============================================================================
if "page" not in st.session_state:
    st.session_state.page = "Workspace"
if "resumes" not in st.session_state:
    st.session_state.resumes = []
if "admin_mode" not in st.session_state:
    st.session_state.admin_mode = False
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Welcome! I am your IMED executive career advisor. Ask me for gap remediation, interview strategies, or skill breakdowns based on your analysis."}
    ]

try:
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
except Exception:
    GEMINI_API_KEY = "PLACEHOLDER_KEY"

# ==============================================================================
# 3. ADVANCED INTELLIGENCE ENGINE (Gemini 3.6 Flash)
# ==============================================================================
@st.cache_resource
def load_placement_engine():
    llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        google_api_key=GEMINI_API_KEY,
        temperature=0.1
    )
    
    system_prompt = (
        "You are a Principal Technical Recruiter and Senior ATS Architect hiring for Tier-1 tech enterprises. "
        "Analyze the provided Resume against the target Job Description with exhaustive depth.\n"
        "You MUST return a strictly valid JSON object with exact keys:\n"
        "{{\n"
        '  "match_score": int (0 to 100),\n'
        '  "ats_readability": int (0 to 100),\n'
        '  "keyword_status": "string evaluation (e.g., Highly Optimized / Moderate Gaps / Critical Deficits)",\n'
        '  "formatting_risks": [list of strings identifying potential layout or parsing flags in the resume],\n'
        '  "matched_skills": [list of strings],\n'
        '  "missing_skills": [list of strings],\n'
        '  "recruiter_verdict": "An uncompromising executive assessment detailing core engineering strengths, formatting vulnerabilities, and strategic hiring alignment.",\n'
        '  "action_plan": [list of 4 granular, highly technical execution steps the candidate must implement],\n'
        '  "optimized_bullets": [list of 2 high-impact, professional resume bullet points integrated with quantitative metrics],\n'
        '  "interview_questions": [list of 3 specific technical interview questions targeted at candidate skill gaps]\n'
        "}}"
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "RESUME TEXT:\n{resume}\n\n---\n\nJOB DESCRIPTION:\n{job_description}"),
    ])
    
    return prompt | llm | JsonOutputParser()

placement_engine = load_placement_engine()

# Helper: PDF Text Extractor & CSV Logger
def extract_and_clean_pdf(uploaded_file):
    reader = PyPDF2.PdfReader(uploaded_file)
    raw_text = ""
    for page in reader.pages:
        raw_text += page.extract_text() or ""
    return re.sub(r'\s+', ' ', raw_text).strip()

def log_student_data(resume_name, score, top_missing_skill):
    file_path = "imed_batch_data.csv"
    file_exists = os.path.isfile(file_path)
    with open(file_path, mode='a', newline='') as file:
        writer = csv.writer(file)
        if not file_exists:
            writer.writerow(["Timestamp", "Candidate", "Match_Score", "Missing_Skill"])
        writer.writerow([datetime.now().strftime("%Y-%m-%d %H:%M"), resume_name, score, top_missing_skill])

# ==============================================================================
# 4. SIDEBAR NAVIGATION & BRANDING
# ==============================================================================
with st.sidebar:
    st.markdown("### ⚡ **IMED Analyzer**")
    st.caption("Placement Cell Intelligence")
    st.markdown("---")
    
    if st.button("⚡  Analyzer Workspace", use_container_width=True):
        st.session_state.page = "Workspace"
        st.rerun()
    if st.button("📊  Institutional Dashboard", use_container_width=True):
        st.session_state.page = "Dashboard"
        st.rerun()

    st.markdown("---")
    st.session_state.admin_mode = st.toggle("🔒 Institutional View (Admin)", value=st.session_state.admin_mode)
    
    st.markdown("---")
    st.markdown("💡 *'Consistency and code execution build empires.'*")
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown("<div style='text-align: center; font-size: 12px; color: #94a3b8;'>Architected by<br><b>Avadhut Gurav</b></div>", unsafe_allow_html=True)


# ==============================================================================
# PAGE 1: UNIFIED WORKSPACE (Upload Resume + Plain Text JD + Analyze Button)
# ==============================================================================
if st.session_state.page == "Workspace":
    st.caption("CANDIDATE WORKSPACE")
    st.title("IMED Placement Gap Analyzer")
    st.markdown("Upload your candidate resume and paste the target job description below to run an instant deep neural ATS alignment scan.")
    
    up_col1, up_col2 = st.columns(2, gap="large")
    with up_col1:
        st.subheader("1. Upload Candidate Resume")
        st.markdown("<p style='color: #94A3B8; font-size: 0.9rem;'>Upload your resume in PDF format.</p>", unsafe_allow_html=True)
        resume_file = st.file_uploader("Upload PDF Resume", type=["pdf"], key="res_up", label_visibility="collapsed")
        if resume_file:
            text = extract_and_clean_pdf(resume_file)
            if not any(d['name'] == resume_file.name for d in st.session_state.resumes):
                st.session_state.resumes.append({"name": resume_file.name, "text": text})
            st.success(f"Loaded: {resume_file.name}")

    with up_col2:
        st.subheader("2. Target Job Description")
        st.markdown("<p style='color: #94A3B8; font-size: 0.9rem;'>Paste target job requirements directly into the text box.</p>", unsafe_allow_html=True)
        jd_text_input = st.text_area("Job Requirements", height=130, placeholder="Paste job description, required technical stack, and responsibilities here...", key="jd_textbox")
        if jd_text_input.strip():
            st.session_state.current_jd = jd_text_input.strip()

    st.markdown("<br>", unsafe_allow_html=True)
    
    # --- DIRECT ANALYZE BUTTON RIGHT UNDER THE INPUTS ---
    has_jd = "current_jd" in st.session_state and st.session_state.current_jd.strip()
    
    if st.button("🚀 Run Comprehensive ATS & Gap Analysis", use_container_width=True):
        if not st.session_state.resumes or not has_jd:
            st.error("⚠️ Please upload a resume PDF on the left and paste a job description on the right before analyzing.")
        else:
            resume_text = st.session_state.resumes[-1]["text"]
            selected_resume_name = st.session_state.resumes[-1]["name"]
            jd_text = st.session_state.current_jd
            
            with st.spinner("Executing neural alignment parsing, formatting risk diagnostics, and executive simulation..."):
                try:
                    result = placement_engine.invoke({
                        "resume": resume_text,
                        "job_description": jd_text
                    })
                    
                    st.session_state.last_result = result
                    st.session_state.last_resume = resume_text
                    st.session_state.last_jd = jd_text
                    
                    score = result.get("match_score", 0)
                    readability = result.get("ats_readability", 90)
                    keyword_status = result.get("keyword_status", "Optimized")
                    
                    # Log data for Admin Dashboard
                    missing_list = result.get("missing_skills", ["General Skills"])
                    top_missing = missing_list[0] if missing_list else "None"
                    log_student_data(selected_resume_name, score, top_missing)
                    
                    # --- METRICS DISPLAY ---
                    st.markdown("---")
                    st.markdown("### Recruiter Intelligence & Analytics")
                    
                    m1, m2, m3 = st.columns(3)
                    with m1:
                        st.markdown(f'<div class="glass-panel" style="text-align: center;"><h4 style="color:#94A3B8;">ATS Match Score</h4><h1 style="color: {"#10B981" if score>=75 else "#F59E0B" if score>=50 else "#EF4444"}; font-size: 2.8rem; margin:0;">{score}%</h1></div>', unsafe_allow_html=True)
                    with m2:
                        st.markdown(f'<div class="glass-panel" style="text-align: center;"><h4 style="color:#94A3B8;">Readability Index</h4><h1 style="color: #6366F1; font-size: 2.8rem; margin:0;">{readability}%</h1></div>', unsafe_allow_html=True)
                    with m3:
                        st.markdown(f'<div class="glass-panel" style="text-align: center;"><h4 style="color:#94A3B8;">Keyword Health</h4><h3 style="color: #A855F7; margin-top: 10px;">{keyword_status}</h3></div>', unsafe_allow_html=True)
                    
                    # --- BENCHMARK PROGRESS ---
                    st.markdown("#### Competitive Market Benchmark")
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    b1, b2, b3 = st.columns(3)
                    with b1:
                        st.metric(label="Your Profile", value=f"{score}%")
                        st.progress(score / 100.0)
                    with b2:
                        st.metric(label="IMED Cohort Avg", value="62%")
                        st.progress(0.62)
                    with b3:
                        st.metric(label="Top Industry Tier", value="85%")
                        st.progress(0.85)
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                    # --- FORMATTING RISKS ---
                    risks = result.get("formatting_risks", [])
                    if risks:
                        st.markdown('<div class="glass-panel" style="border-left: 4px solid #EF4444;">', unsafe_allow_html=True)
                        st.markdown("### Detected Parsing & Formatting Risks")
                        for r in risks:
                            st.markdown(f"• **{r}**")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                    # --- EXECUTIVE VERDICT ---
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    st.markdown("### Executive Recruiter Verdict")
                    st.write(result.get("recruiter_verdict", "No verdict generated."))
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                    # --- SKILLS GAPS ---
                    g1, g2 = st.columns(2, gap="medium")
                    with g1:
                        st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                        st.markdown("### Verified Matched Skills")
                        for s in result.get("matched_skills", []):
                            st.markdown(f"• ✅ **{s}**")
                        st.markdown('</div>', unsafe_allow_html=True)
                    with g2:
                        st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                        st.markdown("### Critical Missing Competencies")
                        for s in result.get("missing_skills", []):
                            st.markdown(f"• ❌ **{s}**")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                    # --- ACTION PLAN & BULLETS ---
                    a1, a2 = st.columns(2, gap="medium")
                    with a1:
                        st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                        st.markdown("### Strategic Action Plan")
                        for idx, step in enumerate(result.get("action_plan", []), 1):
                            st.markdown(f"**{idx}.** {step}")
                        st.markdown('</div>', unsafe_allow_html=True)
                    with a2:
                        st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                        st.markdown("### Optimized Resume Bullet Suggestions")
                        for bullet in result.get("optimized_bullets", []):
                            st.code(bullet, language="markdown")
                        st.markdown('</div>', unsafe_allow_html=True)
                        
                    # --- INTERVIEW QUESTIONS ---
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    st.markdown("### Targeted Technical Interview Prep")
                    for q_idx, q in enumerate(result.get("interview_questions", []), 1):
                        st.markdown(f"**Q{q_idx}:** {q}")
                    st.markdown('</div>', unsafe_allow_html=True)
                    
                    # --- DOWNLOAD PDF REPORT ---
                    st.markdown("<br>", unsafe_allow_html=True)
                    pdf_bytes = create_pdf_report(result, selected_resume_name)
                    st.download_button(
                        label="📥 Download Executive ATS PDF Report",
                        data=pdf_bytes,
                        file_name=f"IMED_ATS_Report_{selected_resume_name.split('.')[0]}.pdf",
                        mime="application/pdf",
                        use_container_width=True
                    )
                    
                except Exception as e:
                    st.error(f"Analysis engine error: {e}")

    # ==============================================================================
    # LIVE AI CAREER COACH CHATBOT SECTION
    # ==============================================================================
    st.markdown("<br><hr><br>", unsafe_allow_html=True)
    st.markdown("### 🧠 Live AI Career Coach & Mock Interviewer")
    st.markdown("<p style='color: #94A3B8;'>Consult your AI assistant for gap remediation or mock grilling on missing skills.</p>", unsafe_allow_html=True)

    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if user_query := st.chat_input("Ask for interview questions, skill breakdown, or career advice..."):
        st.session_state.messages.append({"role": "user", "content": user_query})
        with st.chat_message("user"):
            st.markdown(user_query)

        with st.chat_message("assistant"):
            with st.spinner("Formulating executive advisory strategy..."):
                try:
                    chat_llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash", google_api_key=GEMINI_API_KEY, temperature=0.3)
                    last_res = st.session_state.get("last_resume", "No resume provided.")
                    last_jd = st.session_state.get("last_jd", "No JD provided.")
                    
                    chat_prompt = f"""
                    You are an executive Technical Career Coach and AI Mock Interviewer built by Avadhut Gurav for IMED college students.
                    Use the candidate resume and job description to answer the user's question with extensive depth.
                    
                    CANDIDATE RESUME: {last_res[:1500]}
                    TARGET JOB DESCRIPTION: {last_jd[:1000]}
                    
                    USER QUESTION: {user_query}
                    """
                    response = chat_llm.invoke(chat_prompt)
                    ai_reply = response.content
                    
                    st.markdown(ai_reply)
                    st.session_state.messages.append({"role": "assistant", "content": ai_reply})
                except Exception as e:
                    err = f"Chat advisory error: {e}"
                    st.error(err)
                    st.session_state.messages.append({"role": "assistant", "content": err})

# ==============================================================================
# PAGE 2: INSTITUTIONAL DASHBOARD (Admin View)
# ==============================================================================
elif st.session_state.page == "Dashboard":
    st.caption("INSTITUTIONAL OVERVIEW")
    st.title("IMED Placement Cell Analytics")
    st.markdown("Live aggregate data view identifying batch-wide technical deficiencies.")
    
    try:
        df = pd.read_csv("imed_batch_data.csv")
        total_processed = len(df)
        avg_score = round(df["Match_Score"].astype(float).mean(), 1)
        top_gap = df["Missing_Skill"].mode()[0] if not df.empty else "N/A"
        
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total Students Processed", f"{total_processed}")
        col2.metric("Avg. Match Rate", f"{avg_score}%")
        col3.metric("Critical Skill Gap", f"{top_gap}")
        col4.metric("Active Corporate JDs", "7")
        
        st.markdown("### Recent Processing Activity")
        st.dataframe(df.tail(5), use_container_width=True)
    except FileNotFoundError:
        st.info("No batch data logged yet. Go back to the 'Analyzer Workspace' and run an analysis to populate batch analytics.")