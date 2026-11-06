from datetime import timezone
"""
AI Skills Engine — LegalOS
All 13 AI skills with Gemini integration + mock toggle
"Human Generated, AI Assisted" — every output is flagged for human review
"""
import asyncio
import time
import json
import logging
import string
from typing import Optional, Any
from datetime import datetime

import google.generativeai as genai

from ..config import settings
from ..models import SkillName

logger = logging.getLogger(__name__)

# Configure Gemini
if settings.gemini_api_key:
    try:
        genai.configure(api_key=settings.gemini_api_key)
    except Exception as e:
        logger.warning(f"Failed to configure Google Generative AI API: {e}")


# ─── Safe String Formatter (Prevents KeyError) ───────────────────────────────

class SafeFormatter(dict):
    """Fallback dictionary that returns [key] instead of raising KeyError."""
    def __missing__(self, key: str) -> str:
        return f"[{key}]"


# ─── Mock Responses (All 13 Skills) ──────────────────────────────────────────

MOCK_RESPONSES: dict[SkillName, dict[str, Any]] = {
    SkillName.matter_intake_extraction: {
        "client_name": "Rajesh Kumar Enterprises Pvt. Ltd.",
        "client_email": "rajesh@rkenterprises.com",
        "client_phone": "+91-9876543210",
        "case_type": "civil_suit",
        "court": "high_court",
        "court_name": "Delhi High Court",
        "opposing_party": "ABC Infrastructure Ltd.",
        "relief_sought": "Recovery of ₹2.5 Crore with interest under Section 37 of the Arbitration Act",
        "brief_facts": "Client entered into a construction contract dated March 15, 2022 with the opposing party. The opposing party defaulted on payments totaling ₹2.5 Cr despite multiple reminders. An arbitration clause (Clause 23) exists in the agreement.",
        "suggested_tags": ["arbitration", "recovery", "construction"],
        "confidence": 0.92
    },
    SkillName.preliminary_research: {
        "summary": "The matter involves enforcement of arbitral award under Section 36 of the Arbitration and Conciliation Act, 1996. Key precedents support the client's position for expedited enforcement.",
        "key_precedents": [
            "Hindustan Construction Co. Ltd. v. Union of India (2019) 17 SCC 382 — Supreme Court",
            "BCCI v. Kochi Cricket Pvt. Ltd. (2018) 6 SCC 287 — Automatic stay vacated",
            "Ssangyong Engineering v. NHAI (2019) 15 SCC 131 — Grounds for challenge narrowed"
        ],
        "statutes": ["Section 34, 36, 37 — Arbitration and Conciliation Act, 1996", "Order XXXVII CPC"],
        "legal_position": "Strong. Award enforcement is a ministerial act post-2015 amendment. Challenge window is narrow.",
        "estimated_timeline": "6-18 months for enforcement; interim protection available immediately",
        "risk_assessment": "Low-Medium. Risk of stay order if respondent files S.34 petition within limitation",
        "citation_verified": False,
        "verification_required": ["BCCI v. Kochi Cricket", "Ssangyong Engineering — verify exact citation"]
    },
    SkillName.strategy_note: {
        "legal_position": "Client holds a valid and enforceable arbitral award dated January 10, 2024. Post-2015 amendment, enforcement is a ministerial act. The opposing party's window to file under Section 34 expires March 10, 2024.",
        "key_arguments": [
            "Award is a decree — enforcement proceedings under Section 36 are maintainable",
            "No automatic stay on filing of Section 34 petition post-2015 amendment",
            "Separate application under Section 9 for attachment of assets recommended",
            "Award debtor's assets: Delhi properties + bank accounts — search required"
        ],
        "risks": [
            {"risk": "S.34 challenge filed before enforcement", "severity": "medium", "mitigation": "File S.36 execution immediately; oppose any stay application"},
            {"risk": "Assets transferred before attachment", "severity": "high", "mitigation": "Emergency S.9 application for interim injunction this week"},
            {"risk": "Jurisdictional challenge", "severity": "low", "mitigation": "Award made in Delhi; HC jurisdiction clear"}
        ],
        "recommended_strategy": "Two-track: (1) File execution petition under S.36 immediately. (2) File S.9 application for attachment of identified assets as protective measure. Negotiate in parallel — respondent may prefer settlement over asset freezing.",
        "next_actions": [
            "File S.36 execution petition by this week",
            "Asset search: CERSAI + MCA21 for properties/shares",
            "Prepare S.9 application for emergency asset attachment",
            "Send final demand notice before filing (creates record)"
        ],
        "case_timeline": "Week 1: Filing → Week 2-4: Service + First hearing → Month 2-3: Arguments on stay application",
        "precedents": ["Hindustan Construction — enforcement as ministerial act", "BCCI v. Kochi — no automatic stay"],
        "fee_estimate": "₹5,00,000 — ₹8,00,000 depending on complexity and appeals"
    },
    SkillName.engagement_letter: {
        "letter_html": """<div style="font-family: Georgia, serif; max-width: 700px; padding: 40px;">
<p style="text-align: right; color: #666;">Date: {date}</p>
<h2 style="color: #1e3a5f;">LegalOS</h2>
<p style="color: #666; font-size: 12px;">Senior Advocates | Supreme Court of India & High Courts</p>
<hr/>
<p><strong>To,</strong><br/>
{client_name}<br/>{client_address}</p>
<h3>RE: Letter of Engagement — {matter_title}</h3>
<p>Dear Sir/Ma'am,</p>
<p>We are pleased to confirm your engagement to represent you in the above-captioned matter before the {court_name}. This letter sets out the terms of our engagement.</p>
<h4>1. SCOPE OF WORK</h4>
<p>{scope_of_work}</p>
<h4>2. FEE STRUCTURE</h4>
<p>Retainer Fee: <strong>₹{retainer_amount}</strong> (payable on execution of this letter)<br/>
Hearing Fee: <strong>₹{hearing_fee}</strong> per hearing<br/>
GST @ 18% applicable on all amounts.</p>
<h4>3. CONFIDENTIALITY</h4>
<p>All information shared with us is subject to attorney-client privilege and shall be held in strict confidence.</p>
<p>Please sign and return a copy of this letter to confirm your acceptance.</p>
<p>Yours sincerely,<br/><strong>{advocate_name}</strong></p>
<div style="border-top: 1px solid #ccc; margin-top: 30px; padding-top: 10px;">
<p>✦ <em>This document was drafted with AI assistance and reviewed by a Senior Advocate before dispatch.</em></p>
</div></div>""",
        "requires_fields": ["date", "client_name", "client_address", "matter_title", "court_name", "scope_of_work", "retainer_amount", "hearing_fee", "advocate_name"]
    },
    SkillName.document_query: {
        "query": "What are the key liability and dispute resolution clauses?",
        "answer": "Under Clause 23, all disputes arising out of the agreement are subject to sole arbitration seated in New Delhi under the Arbitration and Conciliation Act, 1996. Clause 18 caps aggregate consequential liability at 10% of contract value, excluding willful default or breach of confidentiality.",
        "citations": [
            {"clause": "Clause 23.1", "excerpt": "Any dispute, controversy or claim... shall be settled by arbitration seated in New Delhi."},
            {"clause": "Clause 18.3", "excerpt": "Neither party shall be liable for indirect or consequential damages, subject to Section 18.5 exclusions."}
        ],
        "confidence_score": 0.94
    },
    SkillName.deviation_flagging: {
        "deviations_count": 2,
        "overall_risk": "medium",
        "deviations": [
            {
                "clause_name": "Limitation of Liability",
                "standard_term": "Mutual cap of 100% of total fees paid over 12 months with gross negligence carved out.",
                "deviating_term": "Unilateral cap of INR 5,00,000 for vendor liability with no carveouts for gross negligence.",
                "risk_level": "high",
                "recommendation": "Negotiate reciprocal liability capped at aggregate contract value and reinstate gross negligence exceptions."
            },
            {
                "clause_name": "Governing Law and Jurisdiction",
                "standard_term": "Laws of India, exclusive jurisdiction of High Court of Delhi.",
                "deviating_term": "Exclusive jurisdiction of courts at Bengaluru.",
                "risk_level": "medium",
                "recommendation": "Amend to Delhi or mutual neutral forum if client's principal place of business is NCR."
            }
        ]
    },
    SkillName.arguments_brief: {
        "matter_summary": "Submissions for Petitioner in execution of arbitral award against respondent default.",
        "primary_submissions": [
            {"issue": "Maintainability of Section 36 execution petition", "argument": "Post 2015 amendment, award is automatically enforceable as a decree of the court without awaiting Section 34 disposal unless an express unconditional stay is granted.", "authorities": ["Hindustan Construction Co. Ltd. v. Union of India (2019) 17 SCC 382"]},
            {"issue": "Attachment of respondent bank accounts", "argument": "Prima facie balance sheet indicates risk of dissipation. Court possesses inherent powers under Order XXI Rule 46 CPC.", "authorities": ["Bhandari Engineers & Builders v. You One Maharia (2020) Delhi HC"]}
        ],
        "anticipated_objections": [
            {"objection": "Respondent claims pending Section 34 petition creates deemed moratorium", "rebuttal": "Expressly rejected by Supreme Court in BCCI v. Kochi Cricket (2018) 6 SCC 287"}
        ],
        "prayer": "Issue warrants of attachment against bank accounts and scheduled real estate assets of Judgment Debtor."
    },
    SkillName.legal_memo: {
        "memorandum_title": "Legal Opinion: Maintainability of Summary Suit vs Arbitral Award Enforcement",
        "question_presented": "Whether the client can initiate simultaneous proceedings under Section 9 of the Arbitration Act for pre-award security while pursuing Section 138 NI Act complaints?",
        "brief_answer": "Yes. Civil interim protection and criminal proceedings under Section 138 of the Negotiable Instruments Act operate in distinct domains and are concurrently maintainable.",
        "statement_of_facts": "Dishonored security cheques totaling ₹2.5 Cr issued under commercial contract containing an arbitration clause.",
        "authorities_analyzed": [
            "Sri Krishna Agencies v. State of A.P. (2009) 1 SCC 69",
            "D. Purushotama Reddy v. K. Sateesh (2008) 8 SCC 505"
        ],
        "conclusion": "Proceed concurrently with Section 9 urgent interim relief for asset disclosure and Section 138 statutory demand notice."
    },
    SkillName.hearing_summary: {
        "summary": "Today's proceedings before the Division Bench resulted in directions to the respondents to file counter-affidavit within 4 weeks. The Court expressed prima facie concern about the delay in payment. Matter is listed for further hearing.",
        "key_observations": [
            "Court noted delay of 18 months in payment",
            "Respondent's counsel sought 6 weeks — Court granted 4",
            "No interim stay on award enforcement"
        ],
        "client_impact": "Positive. Court's prima facie observations support client's position. Next hearing is crucial.",
        "recommended_client_communication": "Reassuring tone — proceedings are on track. Flag the 4-week counter-affidavit deadline."
    },
    SkillName.order_analysis: {
        "order_date": "2024-03-12",
        "bench": "Hon'ble Single Judge, Delhi High Court",
        "operative_directions": [
            "Respondent directed to file affidavit of assets as per Form 16A Appendix E of CPC within two weeks.",
            "Restraint on alienating fixed assets up to ₹2,50,00,000 until next date of listing."
        ],
        "compliance_deadlines": [
            {"task": "Furnish process fee and serve summons via dasti", "deadline": "7 days"},
            {"task": "File response to respondent's stay application", "deadline": "3 weeks"}
        ],
        "client_impact": "Favorable interim injunction obtained securing the decretal amount.",
        "appeal_recommendation": "No appeal warranted by client; prepare contempt notice if disclosure affidavit not filed within 14 days."
    },
    SkillName.invoice_generation: {
        "invoice_html": """<div style="font-family: Inter, sans-serif; max-width: 800px; padding: 40px; background: white;">
<div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px;">
  <div>
    <h2 style="color: #1e3a5f; margin: 0;">LegalOS</h2>
    <p style="color: #666; margin: 4px 0;">AI Practice Operating System</p>
  </div>
  <div style="text-align: right;">
    <h3 style="color: #4F46E5; margin: 0;">INVOICE</h3>
    <p style="font-size: 12px; color: #666;">{invoice_number}</p>
    <p style="font-size: 12px; color: #666;">Date: {date}</p>
  </div>
</div>
<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background: #f8fafc;">
    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0;">Description</th>
    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0;">Amount (₹)</th>
  </tr>
  <tr>
    <td style="padding: 12px;">{milestone_name}</td>
    <td style="padding: 12px; text-align: right;">₹{amount}</td>
  </tr>
  <tr style="background: #f8fafc;">
    <td style="padding: 12px;">GST @ 18%</td>
    <td style="padding: 12px; text-align: right;">₹{gst_amount}</td>
  </tr>
  <tr style="font-weight: bold; border-top: 2px solid #1e3a5f;">
    <td style="padding: 12px;">Total</td>
    <td style="padding: 12px; text-align: right; color: #4F46E5;">₹{total_amount}</td>
  </tr>
</table>
<p style="font-size: 11px; color: #999; margin-top: 30px;">✦ AI Assisted | Reviewed & Approved by Senior Advocate</p>
</div>""",
        "fields": ["invoice_number", "date", "milestone_name", "amount", "gst_amount", "total_amount"]
    },
    SkillName.client_update_email: {
        "subject": "Update on Your Matter — {court_name} Hearing | {date}",
        "body": """Dear {client_name},

I hope this finds you well. I write to update you on today's proceedings before the {court_name}.

**Hearing Summary — {date}**
Court: {court_name} | Bench: {judge_name}

{order_summary}

**Next Steps**
{next_steps}

**Next Hearing**
The matter has been adjourned to {next_date}.

Please do not hesitate to reach out if you have any questions.

With warm regards,
{advocate_name}

---
*✦ Human Generated, AI Assisted — This update was reviewed and approved by your advocate before dispatch.*""",
        "requires_fields": ["client_name", "date", "court_name", "judge_name", "order_summary", "next_steps", "next_date", "advocate_name"]
    },
    SkillName.matter_close_summary: {
        "closure_date": "2024-08-30",
        "final_disposition": "Settled & Decreed via Consent Terms",
        "financial_summary": {
            "total_claim_amount": "₹2,50,00,000",
            "recovered_amount": "₹2,35,00,000",
            "recovery_rate": "94%",
            "total_billed_fees": "₹6,80,000",
            "total_collected": "₹6,80,000",
            "outstanding_balance": "₹0"
        },
        "compliance_checklist": {
            "all_hearings_concluded": True,
            "certified_copies_obtained": True,
            "original_documents_returned": True,
            "client_satisfaction_obtained": True
        },
        "archival_reference": "LOS-ARCH-2024-042"
    }
}


# ─── Prompts (All 13 Skills) ──────────────────────────────────────────────────

SKILL_PROMPTS: dict[SkillName, str] = {
    SkillName.matter_intake_extraction: """You are a legal intake specialist AI for an Indian law firm. 
Extract structured information from the following email/text and return as JSON.
Fields: client_name, client_email, client_phone, case_type, court, court_name, 
opposing_party, relief_sought, brief_facts, suggested_tags, confidence (0-1).
Be precise. If uncertain, set confidence lower.

Input:
{input_text}""",

    SkillName.preliminary_research: """You are a senior legal researcher at a top Indian law firm.
Based on the matter details, provide preliminary legal research as JSON.
Fields: summary, key_precedents (array with full citations), statutes (array), 
legal_position (assessment), estimated_timeline, risk_assessment.
IMPORTANT: Mark citation_verified as false. All citations need human verification.
Include verification_required list for any citations that need checking.

Matter Details:
{matter_details}""",

    SkillName.strategy_note: """You are a senior advocate with 20+ years of experience in Indian courts.
Based on the discussion transcript, generate a comprehensive strategy note as JSON.
Fields: legal_position, key_arguments (array), risks (array of {risk, severity, mitigation}),
recommended_strategy, next_actions (array), case_timeline, precedents (array), fee_estimate.
Be specific, practical, and India-jurisdiction-aware.

Discussion Transcript:
{discussion_transcript}

Matter Context:
{matter_context}""",

    SkillName.engagement_letter: """You are a managing partner at an Indian law firm.
Draft a professional engagement letter based on the matter details.
Return a JSON object with fields:
letter_html (styled HTML string with scope, retainer fee, hearing fee, confidentiality under Advocates Act),
scope_of_work, retainer_amount, hearing_fee, terms_summary.

Client: {client_name}
Matter: {matter_title}
Court: {court_name}
Scope: {scope_of_work}
Retainer Fee: {retainer_amount}
Hearing Fee: {hearing_fee}
Advocate: {advocate_name}
Date: {date}""",

    SkillName.document_query: """You are an AI legal assistant reviewing contract and pleading documents.
Answer the query based ONLY on the provided document excerpts.
Return JSON with fields: query, answer, citations (array of {clause, excerpt}), confidence_score (0-1).

Document Context:
{document_text}

Matter Context:
{matter_context}

Query:
{query}""",

    SkillName.deviation_flagging: """You are an Indian corporate counsel reviewing legal documents against standard risk templates.
Identify any deviations, onerous indemnities, non-standard dispute clauses, or unilateral liabilities.
Return JSON with fields: deviations_count, overall_risk ('low'|'medium'|'high'), deviations (array of {clause_name, standard_term, deviating_term, risk_level, recommendation}).

Document Text:
{document_text}

Matter Context:
{matter_context}""",

    SkillName.arguments_brief: """You are an arguing counsel preparing a court argument bundle in Indian courts.
Draft a structured arguments brief for the petitioner/plaintiff.
Return JSON with fields: matter_summary, primary_submissions (array of {issue, argument, authorities}), anticipated_objections (array of {objection, rebuttal}), prayer.

Matter Details:
{matter_details}

Opposing Submissions:
{opposing_submissions}""",

    SkillName.legal_memo: """You are an Indian appellate research counsel.
Prepare a formal research legal memorandum answering the specific legal question using the IRAC method.
Return JSON with fields: memorandum_title, question_presented, brief_answer, statement_of_facts, authorities_analyzed (array), conclusion.

Question:
{legal_question}

Facts & Matter Context:
{matter_details}""",

    SkillName.hearing_summary: """You are a court reporter and advocate summarizer.
Summarize the daily court hearing proceedings from the bench remarks and order summary.
Return JSON with fields: summary, key_observations (array), client_impact, recommended_client_communication, next_hearing_date.

Hearing Details:
{hearing_details}

Order Summary:
{order_summary}

Bench Remarks:
{bench_remarks}""",

    SkillName.order_analysis: """You are a senior Indian litigator analyzing an interim or final court order.
Extract operative directions, calculate compliance deadlines, evaluate client impact, and advise on appeal feasibility.
Return JSON with fields: order_date, bench, operative_directions (array), compliance_deadlines (array of {task, deadline}), client_impact, appeal_recommendation.

Order Text:
{order_text}

Matter Context:
{matter_details}""",

    SkillName.invoice_generation: """You are a legal billing specialist for an Indian law firm.
Generate a professional, GST-compliant invoice HTML (18% GST).
Format currency figures in Indian numbering format (e.g., ₹2,50,000).
Return JSON with fields: invoice_html, total_amount, gst_amount, invoice_summary.

Invoice Details:
{invoice_details}
Client Name: {client_name}""",

    SkillName.client_update_email: """You are a professional legal communication specialist.
Draft a clear, reassuring client update email based on today's court proceedings.
Return JSON with fields: subject, body (markdown formatted).
Always include the disclosure notice: "✦ Human Generated, AI Assisted — Reviewed by advocate before dispatch".

Hearing Details:
{hearing_details}
Client Name: {client_name}
Advocate Name: {advocate_name}""",

    SkillName.matter_close_summary: """You are a law firm practice manager closing out a concluded matter.
Prepare a comprehensive matter closure summary report.
Return JSON with fields: closure_date, final_disposition, financial_summary (object with total_claim_amount, recovered_amount, recovery_rate, total_billed_fees, total_collected, outstanding_balance), compliance_checklist, archival_reference.

Matter Details:
{matter_details}
Outcome Details:
{outcome_details}""",
}


# ─── AI Skill Runner ──────────────────────────────────────────────────────────

class AISkillRunner:
    """
    Runs AI skills with Gemini, logs all outputs for human review.
    Toggle mock_mode for demos without API calls.
    """

    def __init__(self):
        self.mock_mode = settings.ai_mock_mode
        self.model: Optional[genai.GenerativeModel] = None
        if not self.mock_mode and settings.gemini_api_key:
            model_name = settings.gemini_model or "gemini-3.5-flash-lite"
            try:
                self.model = genai.GenerativeModel(model_name)
                logger.info(f"Initialized Gemini model: {model_name}")
            except Exception as e:
                logger.warning(f"Could not load configured model '{model_name}': {e}. Falling back to gemini-3.5-flash-lite.")
                try:
                    self.model = genai.GenerativeModel("gemini-3.5-flash-lite")
                except Exception as inner_e:
                    logger.error(f"Fallback model initialization failed: {inner_e}")

    async def run_skill(
        self,
        skill_name: SkillName,
        input_data: dict,
        matter_id: str,
        user_id: str,
    ) -> dict:
        """
        Execute an AI skill. Returns structured output ready for human review.
        All outputs are marked 'pending' review — nothing auto-dispatches.
        """
        start_time = time.time()

        try:
            if self.mock_mode or not self.model:
                raw_output = await self._run_mock(skill_name, input_data)
                model_used = f"mock:{settings.gemini_model or 'gemini-3.5-flash-lite'}"
                tokens_used = 0
            else:
                raw_output, tokens_used = await self._run_gemini(skill_name, input_data)
                model_used = settings.gemini_model or "gemini-3.5-flash-lite"

            latency_ms = int((time.time() - start_time) * 1000)

            return {
                "skill_name": skill_name,
                "matter_id": matter_id,
                "raw_output": raw_output,
                "model_used": model_used,
                "tokens_used": tokens_used,
                "latency_ms": latency_ms,
                "review_status": "pending",
                "ai_assisted": True,
                "human_verified": False,  # CRITICAL: Always starts False
                "created_at": datetime.now(timezone.utc).isoformat(),
            }

        except Exception as e:
            logger.error(f"AI Skill {skill_name} failed: {e}")
            raise

    async def _run_mock(self, skill_name: SkillName, input_data: dict) -> str:
        """Return mock response with realistic delay"""
        await asyncio.sleep(1.2)  # Simulate realistic AI latency
        mock = MOCK_RESPONSES.get(skill_name, {"message": f"Mock output for {skill_name.value}"})
        return json.dumps(mock, indent=2)

    async def _run_gemini(self, skill_name: SkillName, input_data: dict) -> tuple[str, int]:
        """Run actual Gemini API call with safe formatting"""
        prompt_template = SKILL_PROMPTS.get(
            skill_name,
            "You are an Indian legal assistant. Analyze the following matter context:\n{matter_details}\nInput:\n{input_text}"
        )
        # Format safely with SafeFormatter to never raise KeyError on missing fields
        prompt = prompt_template.format_map(SafeFormatter(input_data))

        generation_config = genai.GenerationConfig(
            response_mime_type="application/json",
            temperature=0.2,  # Low temperature for legal rigor
            max_output_tokens=4096,
        )

        if not self.model:
            raise ValueError("GenerativeModel is not initialized.")

        response = await asyncio.to_thread(
            self.model.generate_content,
            prompt,
            generation_config=generation_config,
        )

        tokens_used = response.usage_metadata.total_token_count if response.usage_metadata else 0
        return response.text, tokens_used


# Global instance
skill_runner = AISkillRunner()
