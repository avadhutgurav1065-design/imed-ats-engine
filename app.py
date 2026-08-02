import streamlit as st
import PyPDF2
import json
import re
from io import BytesIO
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
import plotly.express as px
import plotly.graph_objects as go
from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

# --- NEW: External PDF Engine ---
from pdf_engine import create_pdf_report

# 1. Page Configuration & Elite Dark Theme
st.set_page_config(
    page_title="IMED Placement Gap Analyzer Assistant",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

def apply_enterprise_ui():
    st.markdown("""
    <style>
        /* 1. Force Absolute Black Background */
        .stApp {
            background-color: #000000 !important;
        }

        /* 2. Deep Black Input Fields & Neon Hover */
        .stTextInput input, .stTextArea textarea, .stChatInputContainer {
            background-color: #111111 !important;
            color: #FFFFFF !important;
            border: 1px solid #333333 !important;
            border-radius: 10px !important;
            transition: all 0.3s ease-in-out;
        }
        
        .stTextInput input:hover, .stTextArea textarea:hover {
            border-color: #4f46e5 !important;
        }
        
        /* Neon Glow Focus State */
        .stTextInput input:focus, .stTextArea textarea:focus {
            border-color: #6366F1 !important;
            box-shadow: 0 0 12px rgba(99, 102, 241, 0.5) !important;
            outline: none !important;
        }

        /* 3. High-End Interactive Buttons */
        .stButton>button {
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%) !important;
            color: #FFFFFF !important;
            border: 1px solid #4f46e5 !important;
            border-radius: 8px !important;
            font-weight: 600 !important;
            letter-spacing: 0.5px !important;
            transition: all 0.3s ease-in-out;
        }
        
        .stButton>button:hover {
            transform: translateY(-2px);
            background: linear-gradient(135deg, #312e81 0%, #4f46e5 100%) !important;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.6) !important;
            border-color: #818cf8 !important;
        }
        
        /* 4. Chat Message Readability */
        .stChatMessage {
            background-color: #111111 !important;
            color: #FFFFFF !important;
            border-radius: 10px !important;
            padding: 15px !important;
            margin-bottom: 10px !important;
            border: 1px solid #333333 !important;
            transition: all 0.3s ease;
        }
        
        .stChatMessage:hover {
            border-color: #4f46e5 !important;
        }
        
        /* Force Text Colors to White */
        h1, h2, h3, h4, h5, h6, p, span, div {
            color: #FFFFFF !important;
        }
    </style>
    """, unsafe_allow_html=True)

apply_enterprise_ui()
# 2. Secure API Configuration
try:
    GEMINI_API_KEY = st.secrets["GEMINI_API_KEY"]
except Exception:
    GEMINI_API_KEY = "PLACEHOLDER_KEY"

# 3. Advanced Enterprise Intelligence Engine
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

# Helper: Robust PDF Text Normalizer & Extractor
def extract_and_clean_pdf(uploaded_file):
    reader = PyPDF2.PdfReader(uploaded_file)
    raw_text = ""
    for page in reader.pages:
        raw_text += page.extract_text() or ""
    return re.sub(r'\s+', ' ', raw_text).strip()

# 4. Hero Section Header
st.markdown("""
<div style="padding: 10px 0 25px 0;">
    <h1 style="font-size: 3.5rem !important; font-weight: 900 !important; letter-spacing: -2px; background: linear-gradient(135deg, #6366F1 0%, #A855F7 45%, #EC4899 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; line-height: 1.15; margin-bottom: 12px;">
        IMED Placement Gap Analyzer Assistant
    </h1>
    <p style="color: #94A3B8; font-size: 1.25rem; font-weight: 400; letter-spacing: 0.3px; max-width: 950px;">
        Enterprise-grade resume optimization, automated ATS parsing simulation, formatting risk diagnostics, and executive recruiter intelligence.
    </p>
</div>
""", unsafe_allow_html=True)

# 5. Sidebar Controls
with st.sidebar:
    st.markdown("### Optimization Hub")
    st.info("Strategy Note: Align your core technical stack section directly with mandatory competency requirements to surpass the 80% corporate screening threshold.")
    st.markdown("---")
    st.markdown("### System Telemetry")
    st.success("Neural Match Stream: Online")
    st.success("ATS Filter Engine: Active")
    st.markdown("---")
    st.markdown("<p style='font-size: 0.75rem; color: #64748B;'>IMED Career Cell Intelligence Platform</p>", unsafe_allow_html=True)

# 6. Dual-Column Inputs
col1, col2 = st.columns(2, gap="large")

with col1:
    st.markdown("### Step 1: Upload Candidate Resume")
    st.markdown("<p style='color: #94A3B8; font-size: 0.95rem;'>Upload your resume in PDF format for deep neural text parsing.</p>", unsafe_allow_html=True)
    uploaded_resume = st.file_uploader("Upload PDF Resume", type=["pdf"], label_visibility="collapsed")
    if uploaded_resume:
        st.success(f"Verified: {uploaded_resume.name} ({round(uploaded_resume.size/1024, 1)} KB)")

with col2:
    st.markdown("### Step 2: Target Job Description")
    st.markdown("<p style='color: #94A3B8; font-size: 0.95rem;'>Paste target job requirements from corporate portals or hiring boards.</p>", unsafe_allow_html=True)
    job_desc_input = st.text_area("Job Requirements", height=140, placeholder="Paste job description and required competencies here...", label_visibility="collapsed")

# 7. Execution Trigger & Analytics Dashboard
st.markdown("<br>", unsafe_allow_html=True)
scan_button = st.button("Run Comprehensive ATS & Gap Analysis", use_container_width=True)

if scan_button:
    if uploaded_resume and job_desc_input.strip():
        with st.spinner("Executing neural alignment parsing, syntax sanitization, and corporate ATS simulation..."):
            try:
                resume_text = extract_and_clean_pdf(uploaded_resume)
                result = placement_engine.invoke({
                    "resume": resume_text,
                    "job_description": job_desc_input
                })
                
                st.session_state.last_resume = resume_text
                st.session_state.last_jd = job_desc_input
                st.session_state.last_result = result
                
                # --- METRICS & TELEMETRY ---
                st.markdown("---")
                st.markdown("### Recruiter Intelligence & Analytics")
                
                score = result.get("match_score", 0)
                readability = result.get("ats_readability", 92)
                keyword_status = result.get("keyword_status", "Optimized")
                
                m1, m2, m3 = st.columns(3)
                with m1:
                    st.markdown(f'<div class="glass-panel" style="text-align: center;"><h4 style="color:#94A3B8; margin-bottom:5px;">ATS Match Score</h4><h1 style="color: {"#10B981" if score>=75 else "#F59E0B" if score>=50 else "#EF4444"}; font-size: 2.8rem; margin:0;">{score}%</h1></div>', unsafe_allow_html=True)
                with m2:
                    st.markdown(f'<div class="glass-panel" style="text-align: center;"><h4 style="color:#94A3B8; margin-bottom:5px;">Readability Index</h4><h1 style="color: #6366F1; font-size: 2.8rem; margin:0;">{readability}%</h1></div>', unsafe_allow_html=True)
                with m3:
                    st.markdown(f'<div class="glass-panel" style="text-align: center;"><h4 style="color:#94A3B8; margin-bottom:5px;">Keyword Health</h4><h3 style="color: #A855F7; margin-top: 10px;">{keyword_status}</h3></div>', unsafe_allow_html=True)
                
                # --- BULLETPROOF NATIVE STREAMLIT BENCHMARK ---
                st.markdown("#### Competitive Market Benchmark")
                st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                
                b1, b2, b3 = st.columns(3)
                with b1:
                    st.metric(label="Your Candidate Profile", value=f"{score}%")
                    st.progress(score / 100.0)
                with b2:
                    st.metric(label="IMED Cohort Average", value="62%")
                    st.progress(0.62)
                with b3:
                    st.metric(label="Top Industry Tier", value="85%")
                    st.progress(0.85)
                    
                st.markdown('</div>', unsafe_allow_html=True)

                # --- FORMATTING RISKS & PARSING FLAGS ---
                risks = result.get("formatting_risks", [])
                if risks:
                    st.markdown('<div class="glass-panel" style="border-left: 4px solid #EF4444;">', unsafe_allow_html=True)
                    st.markdown("### Detected Parsing & Formatting Risks")
                    for risk in risks:
                        st.markdown(f"• **{risk}**")
                    st.markdown('</div>', unsafe_allow_html=True)

                # --- EXECUTIVE RECRUITER VERDICT ---
                st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                st.markdown("### Executive Recruiter Verdict")
                st.write(result.get("recruiter_verdict", "Assessment unavailable."))
                st.markdown('</div>', unsafe_allow_html=True)

                # --- SKILL MATCH VS GAPS ---
                g_col1, g_col2 = st.columns(2, gap="medium")
                
                with g_col1:
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    st.markdown("### Verified Matched Skills")
                    for skill in result.get("matched_skills", []):
                        st.markdown(f"• **{skill}**")
                    st.markdown('</div>', unsafe_allow_html=True)
                        
                with g_col2:
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    st.markdown("### Missing Critical Competencies")
                    for skill in result.get("missing_skills", []):
                        st.markdown(f"• **{skill}**")
                    st.markdown('</div>', unsafe_allow_html=True)

                # --- ACTION PLAN & RESUME BULLETS ---
                a_col1, a_col2 = st.columns(2, gap="medium")
                
                with a_col1:
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    st.markdown("### Strategic Action Plan")
                    for idx, step in enumerate(result.get("action_plan", []), 1):
                        st.markdown(f"**{idx}.** {step}")
                    st.markdown('</div>', unsafe_allow_html=True)
                        
                with a_col2:
                    st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                    st.markdown("### Optimized Resume Bullet Suggestions")
                    for bullet in result.get("optimized_bullets", []):
                        st.code(bullet, language="markdown")
                    st.markdown('</div>', unsafe_allow_html=True)

                # --- TECHNICAL INTERVIEW PREP QUESTIONS ---
                st.markdown('<div class="glass-panel">', unsafe_allow_html=True)
                st.markdown("### Targeted Technical Interview Prep")
                st.markdown("<p style='color: #94A3B8;'>Anticipated recruiter interview questions based on your identified skill gaps:</p>", unsafe_allow_html=True)
                for q_idx, q in enumerate(result.get("interview_questions", []), 1):
                    st.markdown(f"**Q{q_idx}:** {q}")
                st.markdown('</div>', unsafe_allow_html=True)

                # --- DOWNLOAD PDF REPORT BUTTON ---
                st.markdown("<br>", unsafe_allow_html=True)
                pdf_bytes = create_pdf_report(result, uploaded_resume.name)
                st.download_button(
                    label="📥 Download Executive ATS PDF Report",
                    data=pdf_bytes,
                    file_name=f"IMED_ATS_Report_{uploaded_resume.name.split('.')[0]}.pdf",
                    mime="application/pdf",
                    use_container_width=True
                )
                        
            except Exception as e:
                st.error(f"Execution error encountered: {e}")
    else:
        st.warning("Please provide both a candidate resume PDF and a target job description to initiate the scan.")

# 8. Interactive AI Career Coach Chatbot Section
st.markdown("<br><hr><br>", unsafe_allow_html=True)
st.markdown("### 🧠 Live AI Career Coach & Advanced Analytics")
st.markdown("<p style='color: #94A3B8;'>Consult your AI recruiter assistant. Ask for gap remediation, interview strategy, or statistical skill breakdowns. The AI has access to the university knowledge base.</p>", unsafe_allow_html=True)

if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Initializing executive career advisory mode. I can provide detailed insights, radar charts for skills, and answer questions based on the IMED knowledge base. How can I help you today?"}
    ]

# Setup RAG once
@st.cache_resource
def get_rag_chain():
    try:
        embeddings = FastEmbedEmbeddings()
        db = Chroma(persist_directory="chroma_db", embedding_function=embeddings)
        retriever = db.as_retriever(search_kwargs={"k": 3})
        
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.6-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3,
            max_output_tokens=4000
        )
        
        system_prompt = (
            "You are an executive Technical Career Coach and AI assistant built by Avadhut for IMED college. "
            "Use the following pieces of retrieved context, along with the candidate's resume and job description, to answer the user's question. "
            "Provide extensive, detailed answers. "
            "If the user asks for a chart, statistics, or skill gap analysis, you can output a JSON block wrapped in ```json ... ``` that contains data for a chart. "
            "The JSON MUST follow this structure: \n"
            '{"chart_type": "radar" or "bar", "title": "Chart Title", "labels": ["A", "B", "C"], "values": [80, 50, 90]}\n'
            "Always provide helpful text before or after the JSON block.\n\n"
            "Retrieved Context: {context}\n\n"
            "CANDIDATE RESUME:\n{resume}\n\n"
            "TARGET JOB DESCRIPTION:\n{jd}"
        )
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}"),
        ])
        
        question_answer_chain = create_stuff_documents_chain(llm, prompt)
        return create_retrieval_chain(retriever, question_answer_chain)
    except Exception as e:
        st.error(f"Failed to initialize RAG: {e}")
        return None

rag_chain = get_rag_chain()

for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "chart_data" in message:
            chart_data = message["chart_data"]
            if chart_data["chart_type"] == "radar":
                fig = go.Figure(data=go.Scatterpolar(
                  r=chart_data["values"],
                  theta=chart_data["labels"],
                  fill='toself',
                  line_color='#6366F1'
                ))
                fig.update_layout(
                  polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
                  showlegend=False,
                  title=chart_data["title"],
                  paper_bgcolor='rgba(0,0,0,0)',
                  plot_bgcolor='rgba(0,0,0,0)',
                  font=dict(color='#F8FAFC')
                )
                st.plotly_chart(fig, use_container_width=True)
            elif chart_data["chart_type"] == "bar":
                fig = px.bar(x=chart_data["labels"], y=chart_data["values"], title=chart_data["title"])
                fig.update_layout(
                    paper_bgcolor='rgba(0,0,0,0)',
                    plot_bgcolor='rgba(0,0,0,0)',
                    font=dict(color='#F8FAFC')
                )
                fig.update_traces(marker_color='#A855F7')
                st.plotly_chart(fig, use_container_width=True)

if user_query := st.chat_input("Ask for a skill gap radar chart, or consult career advisor..."):
    st.session_state.messages.append({"role": "user", "content": user_query})
    with st.chat_message("user"):
        st.markdown(user_query)

    with st.chat_message("assistant"):
        with st.spinner("Formulating executive advisory strategy & analyzing knowledge base..."):
            try:
                context_resume = st.session_state.get("last_resume", "No resume provided.")
                context_jd = st.session_state.get("last_jd", "No job description provided.")
                
                if rag_chain:
                    response_obj = rag_chain.invoke({
                        "input": user_query,
                        "resume": context_resume[:1500],
                        "jd": context_jd[:1000]
                    })
                    ai_response = response_obj["answer"]
                else:
                    ai_response = "RAG system offline. Please try again later."
                
                # Check for JSON chart data in response
                chart_data = None
                json_match = re.search(r'```json\s*(\{.*?\})\s*```', ai_response, re.DOTALL)
                if json_match:
                    try:
                        chart_data = json.loads(json_match.group(1))
                        # Remove the json block from the displayed text
                        ai_response = re.sub(r'```json\s*\{.*?\}\s*```', '', ai_response, flags=re.DOTALL).strip()
                    except json.JSONDecodeError:
                        pass
                
                st.markdown(ai_response)
                
                if chart_data:
                    if chart_data.get("chart_type") == "radar":
                        fig = go.Figure(data=go.Scatterpolar(
                          r=chart_data.get("values", []),
                          theta=chart_data.get("labels", []),
                          fill='toself',
                          line_color='#6366F1'
                        ))
                        fig.update_layout(
                          polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
                          showlegend=False,
                          title=chart_data.get("title", ""),
                          paper_bgcolor='rgba(0,0,0,0)',
                          plot_bgcolor='rgba(0,0,0,0)',
                          font=dict(color='#F8FAFC')
                        )
                        st.plotly_chart(fig, use_container_width=True)
                    elif chart_data.get("chart_type") == "bar":
                        fig = px.bar(x=chart_data.get("labels", []), y=chart_data.get("values", []), title=chart_data.get("title", ""))
                        fig.update_layout(
                            paper_bgcolor='rgba(0,0,0,0)',
                            plot_bgcolor='rgba(0,0,0,0)',
                            font=dict(color='#F8FAFC')
                        )
                        fig.update_traces(marker_color='#A855F7')
                        st.plotly_chart(fig, use_container_width=True)
                
                msg_dict = {"role": "assistant", "content": ai_response}
                if chart_data:
                    msg_dict["chart_data"] = chart_data
                st.session_state.messages.append(msg_dict)
                
            except Exception as e:
                error_msg = f"Advisory error encountered: {e}"
                st.error(error_msg)
                st.session_state.messages.append({"role": "assistant", "content": error_msg})