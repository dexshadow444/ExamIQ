"""
JM Vertex ExamIQ - Paper Exporter (PDF and DOCX)
Generates high-fidelity printable examinations and answer keys with embedded
Noto Sans Tamil Unicode typography conforming to TN State Board formatting.
"""

import io
import os
import pathlib
from typing import Any, Dict

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

DATA_DIR = pathlib.Path(__file__).parent.parent / "data"
FONT_PATH = DATA_DIR / "NotoSansTamil-Regular.ttf"

_FONT_REGISTERED = False


def _register_tamil_font():
    """Registers Noto Sans Tamil font with ReportLab if available."""
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return

    if FONT_PATH.exists():
        try:
            pdfmetrics.registerFont(TTFont("NotoSansTamil", str(FONT_PATH)))
            _FONT_REGISTERED = True
        except Exception as e:
            pass


def export_paper_to_pdf(paper: Dict[str, Any], include_answers: bool = False) -> bytes:
    """
    Renders question paper or complete answer key to PDF.
    Returns bytes of the compiled PDF.
    """
    _register_tamil_font()
    font_name = "NotoSansTamil" if _FONT_REGISTERED else "Helvetica"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "ExamTitle",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=13,
        leading=16,
        alignment=1,  # Centered
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "ExamSubtitle",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=11,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=6,
    )
    meta_style = ParagraphStyle(
        "ExamMeta",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#334155"),
    )
    sec_heading_style = ParagraphStyle(
        "SecHeading",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        leading=14,
        fontStyle="Bold",
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=10,
        spaceAfter=4,
    )
    instr_style = ParagraphStyle(
        "SecInstr",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#475569"),
        spaceAfter=6,
    )
    q_en_style = ParagraphStyle(
        "QEn",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#0f172a"),
        spaceAfter=2,
    )
    q_ta_style = ParagraphStyle(
        "QTa",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor("#1e293b"),
        spaceAfter=4,
    )
    opt_style = ParagraphStyle(
        "QOpt",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#334155"),
        leftIndent=14,
    )
    ans_style = ParagraphStyle(
        "QAns",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#047857"),
        leftIndent=14,
        spaceAfter=4,
    )

    story = []

    # Header
    doc_type = "OFFICIAL ANSWER KEY & STEP-WISE MARKING SCHEME" if include_answers else "HIGHER SECONDARY EXAMINATION (CLASS 12)"
    story.append(Paragraph("GOVERNMENT OF TAMIL NADU — DIRECTORATE OF GOVERNMENT EXAMINATIONS", meta_style))
    story.append(Paragraph(f"<b>{paper.get('title', 'Class 12 Examination')}</b>", title_style))
    story.append(Paragraph(f"<b>{paper.get('subject', 'Subject')}</b> — {doc_type}", subtitle_style))

    # Meta Table: Time & Max Marks
    meta_data = [
        [
            Paragraph(f"<b>Time Allowed:</b> {paper.get('durationMinutes', 90)} Minutes", meta_style),
            Paragraph(f"<b>Maximum Marks:</b> {paper.get('totalMarks', 50)}", ParagraphStyle("RightMeta", parent=meta_style, alignment=2)),
        ]
    ]
    t = Table(meta_data, colWidths=[260, 260])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
    ]))
    story.append(t)
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#94a3b8"), spaceAfter=8, spaceBefore=4))

    # Sections & Questions
    for sec in paper.get("sections", []):
        story.append(Paragraph(f"<b>{sec.get('name', 'Part')} ({sec.get('nameTamil', '')}) — [{sec.get('totalMarks', '')} Marks]</b>", sec_heading_style))
        if sec.get("instructions"):
            story.append(Paragraph(f"<i>{sec.get('instructions')}</i>", instr_style))

        for q in sec.get("questions", []):
            q_no = q.get("no", "")
            marks = q.get("marks", 1)
            comp_tag = " (Compulsory / கட்டாய வினா)" if q.get("isCompulsory") else ""
            either_tag = " (Either/Or)" if q.get("isEitherOr") else ""

            # English Text
            en_text = f"<b>{q_no}.</b> {q.get('textEn', '')} <b>[{marks} Mark{'s' if marks > 1 else ''}]{comp_tag}{either_tag}</b>"
            story.append(Paragraph(en_text, q_en_style))

            # Tamil Text
            if q.get("textTa"):
                story.append(Paragraph(q.get("textTa"), q_ta_style))

            # Options for MCQ
            opts = q.get("options", [])
            if opts:
                opt_texts = [f"({chr(97 + i)}) {opt}" for i, opt in enumerate(opts)]
                # Split options in rows of 2
                for row_start in range(0, len(opt_texts), 2):
                    row_opts = opt_texts[row_start:row_start + 2]
                    story.append(Paragraph(" &nbsp; &nbsp; ".join(row_opts), opt_style))

            # Answer & Rubric if include_answers
            if include_answers:
                ans_str = f"<b>Answer:</b> {q.get('answer', 'Verified')}"
                story.append(Paragraph(ans_str, ans_style))
                scheme = q.get("markingScheme") or q.get("marking_scheme") or []
                if scheme:
                    for s in scheme:
                        step_txt = f"• {s.get('step', '')} <i>[{s.get('marks', '')} M]</i>"
                        story.append(Paragraph(step_txt, opt_style))

            story.append(Spacer(1, 4))

        story.append(Spacer(1, 6))

    doc.build(story)
    return buffer.getvalue()


def export_paper_to_docx(paper: Dict[str, Any], include_answers: bool = False) -> bytes:
    """
    Renders question paper or complete answer key to DOCX (Microsoft Word).
    Returns bytes of the compiled DOCX document.
    """
    doc = docx.Document()

    # Document Header
    p_gov = doc.add_paragraph()
    p_gov.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_gov = p_gov.add_run("GOVERNMENT OF TAMIL NADU — DIRECTORATE OF GOVERNMENT EXAMINATIONS\n")
    r_gov.font.size = Pt(9)
    r_gov.font.color.rgb = RGBColor(100, 116, 139)

    doc_type = "OFFICIAL ANSWER KEY & STEP-WISE MARKING SCHEME" if include_answers else "HIGHER SECONDARY EXAMINATION (CLASS 12)"
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run(f"{paper.get('title', 'Class 12 Examination')}\n")
    r_title.bold = True
    r_title.font.size = Pt(14)
    r_title.font.color.rgb = RGBColor(15, 23, 42)

    r_sub = p_title.add_run(f"{paper.get('subject', 'Subject')} — {doc_type}")
    r_sub.font.size = Pt(11)
    r_sub.bold = True
    r_sub.font.color.rgb = RGBColor(30, 41, 59)

    # Meta Table: Duration & Marks
    meta_table = doc.add_table(rows=1, cols=2)
    meta_table.autofit = True
    cell_left = meta_table.cell(0, 0)
    cell_right = meta_table.cell(0, 1)

    p_l = cell_left.paragraphs[0]
    p_l.add_run(f"Time Allowed: {paper.get('durationMinutes', 90)} Minutes").bold = True
    p_l.runs[0].font.size = Pt(9.5)

    p_r = cell_right.paragraphs[0]
    p_r.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_r.add_run(f"Maximum Marks: {paper.get('totalMarks', 50)}").bold = True
    p_r.runs[0].font.size = Pt(9.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Sections & Questions
    for sec in paper.get("sections", []):
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(10)
        p_sec.paragraph_format.space_after = Pt(2)
        r_sec = p_sec.add_run(f"{sec.get('name', 'Part')} ({sec.get('nameTamil', '')}) — [{sec.get('totalMarks', '')} Marks]")
        r_sec.bold = True
        r_sec.font.size = Pt(11)
        r_sec.font.color.rgb = RGBColor(30, 41, 59)

        if sec.get("instructions"):
            p_ins = doc.add_paragraph()
            p_ins.paragraph_format.space_after = Pt(6)
            r_ins = p_ins.add_run(sec.get("instructions"))
            r_ins.italic = True
            r_ins.font.size = Pt(9)
            r_ins.font.color.rgb = RGBColor(100, 116, 139)

        for q in sec.get("questions", []):
            q_no = q.get("no", "")
            marks = q.get("marks", 1)
            comp_tag = " (Compulsory / கட்டாய வினா)" if q.get("isCompulsory") else ""
            either_tag = " (Either/Or)" if q.get("isEitherOr") else ""

            p_q = doc.add_paragraph()
            p_q.paragraph_format.space_before = Pt(4)
            p_q.paragraph_format.space_after = Pt(2)

            r_no = p_q.add_run(f"{q_no}. ")
            r_no.bold = True
            r_no.font.size = Pt(10)

            r_en = p_q.add_run(q.get("textEn", ""))
            r_en.font.size = Pt(10)

            r_m = p_q.add_run(f"  [{marks} Mark{'s' if marks > 1 else ''}]{comp_tag}{either_tag}")
            r_m.bold = True
            r_m.font.size = Pt(9.5)
            r_m.font.color.rgb = RGBColor(71, 85, 105)

            if q.get("textTa"):
                p_ta = doc.add_paragraph()
                p_ta.paragraph_format.space_after = Pt(3)
                p_ta.paragraph_format.left_indent = Inches(0.2)
                r_ta = p_ta.add_run(q.get("textTa"))
                r_ta.font.size = Pt(9.5)
                r_ta.font.color.rgb = RGBColor(30, 41, 59)

            opts = q.get("options", [])
            if opts:
                p_opt = doc.add_paragraph()
                p_opt.paragraph_format.left_indent = Inches(0.3)
                p_opt.paragraph_format.space_after = Pt(3)
                for i, opt in enumerate(opts):
                    r_o = p_opt.add_run(f"({chr(97 + i)}) {opt}    ")
                    r_o.font.size = Pt(9)

            if include_answers:
                p_ans = doc.add_paragraph()
                p_ans.paragraph_format.left_indent = Inches(0.3)
                p_ans.paragraph_format.space_after = Pt(4)
                r_a = p_ans.add_run(f"Answer: {q.get('answer', 'Verified')}\n")
                r_a.bold = True
                r_a.font.size = Pt(9)
                r_a.font.color.rgb = RGBColor(4, 120, 87)

                scheme = q.get("markingScheme") or q.get("marking_scheme") or []
                for s in scheme:
                    r_s = p_ans.add_run(f"  • {s.get('step', '')} [{s.get('marks', '')} M]\n")
                    r_s.italic = True
                    r_s.font.size = Pt(8.5)
                    r_s.font.color.rgb = RGBColor(71, 85, 105)

    buffer = io.BytesIO()
    doc.save(buffer)
    return buffer.getvalue()
