from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / "docs" / "fyp" / "images" / "fig-1-voice2law-clear-overview.png"

W, H = 2400, 1500
BG = "#F7FAFC"
NAVY = "#0B3D2E"
GREEN = "#1FAA59"
GOLD = "#C5A253"
BLUE = "#1F4D78"
GRAY = "#5F6673"
LIGHT_GREEN = "#E8F5ED"
LIGHT_BLUE = "#E8EEF5"
LIGHT_GOLD = "#FFF7E0"
WHITE = "#FFFFFF"
LINE = "#B9C3CF"


def font(size: int, bold: bool = False):
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for candidate in candidates:
        p = Path(candidate)
        if p.exists():
            return ImageFont.truetype(str(p), size=size)
    return ImageFont.load_default()


F_TITLE = font(64, True)
F_SUB = font(30)
F_BOX = font(31, True)
F_TEXT = font(24)
F_SMALL = font(21)
F_TAG = font(19, True)


def round_rect(draw: ImageDraw.ImageDraw, xy, radius, fill, outline=LINE, width=3):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def centered(draw, xy, text, fnt, fill=NAVY, spacing=8):
    x1, y1, x2, y2 = xy
    lines = text.split("\n")
    heights = [draw.textbbox((0, 0), line, font=fnt)[3] for line in lines]
    total_h = sum(heights) + spacing * (len(lines) - 1)
    y = y1 + (y2 - y1 - total_h) / 2
    for line, h in zip(lines, heights):
        bbox = draw.textbbox((0, 0), line, font=fnt)
        x = x1 + (x2 - x1 - (bbox[2] - bbox[0])) / 2
        draw.text((x, y), line, font=fnt, fill=fill)
        y += h + spacing


def label(draw, xy, title, body, fill, title_color=NAVY):
    x1, y1, x2, y2 = xy
    round_rect(draw, xy, 28, fill)
    title_bbox = draw.textbbox((0, 0), title, font=F_BOX)
    draw.text((x1 + 30, y1 + 28), title, font=F_BOX, fill=title_color)
    y = y1 + 78
    for line in body.split("\n"):
        draw.text((x1 + 32, y), line, font=F_TEXT, fill="#1E293B")
        y += 36


def arrow(draw, start, end, color=NAVY, width=8):
    draw.line([start, end], fill=color, width=width)
    ex, ey = end
    sx, sy = start
    if abs(ex - sx) >= abs(ey - sy):
        direction = 1 if ex > sx else -1
        pts = [(ex, ey), (ex - direction * 32, ey - 18), (ex - direction * 32, ey + 18)]
    else:
        direction = 1 if ey > sy else -1
        pts = [(ex, ey), (ex - 18, ey - direction * 32), (ex + 18, ey - direction * 32)]
    draw.polygon(pts, fill=color)


def pill(draw, xy, text, fill, text_fill=WHITE):
    round_rect(draw, xy, 28, fill, outline=fill, width=1)
    centered(draw, xy, text, F_TAG, fill=text_fill, spacing=0)


def main():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Header
    draw.text((120, 75), "Voice2Law Project Overview", font=F_TITLE, fill=NAVY)
    draw.text(
        (122, 155),
        "AI-Based Urdu/English legal information assistant for Pakistan - clear report diagram",
        font=F_SUB,
        fill=GRAY,
    )
    pill(draw, (1900, 86, 2250, 142), "FYP-II Diagram", GOLD)

    # Main flow boxes
    boxes = {
        "user": (120, 330, 450, 560),
        "frontend": (560, 330, 910, 560),
        "backend": (1020, 330, 1370, 560),
        "nlp": (1480, 330, 1830, 560),
        "answer": (1940, 330, 2280, 560),
    }
    label(draw, boxes["user"], "User Input", "Urdu / English\nText question\nVoice question", LIGHT_GOLD)
    label(draw, boxes["frontend"], "React Frontend", "Home, Ask, Voice\nFind Lawyers\nAdmin routes", LIGHT_GREEN)
    label(draw, boxes["backend"], "Express Backend", "REST API\nFirebase auth\nQuery logging", LIGHT_BLUE)
    label(draw, boxes["nlp"], "FastAPI NLP", "RAG retrieval\nSTT / TTS\nAnswer cache", "#EAF7FF")
    label(draw, boxes["answer"], "User Output", "Grounded answer\nSource excerpts\nLawyer suggestions", LIGHT_GOLD)

    arrow(draw, (450, 445), (560, 445))
    arrow(draw, (910, 445), (1020, 445))
    arrow(draw, (1370, 445), (1480, 445))
    arrow(draw, (1830, 445), (1940, 445))

    # Data and services layer
    draw.text((120, 690), "Data, AI, and Safety Layer", font=font(38, True), fill=BLUE)
    lower = {
        "pdf": (150, 790, 500, 1015),
        "chroma": (610, 790, 960, 1015),
        "llm": (1070, 790, 1420, 1015),
        "fire": (1530, 790, 1880, 1015),
        "lawyer": (1990, 790, 2290, 1015),
    }
    label(draw, lower["pdf"], "Legal PDFs", "PPC\nFamily law\nCriminal + property", WHITE)
    label(draw, lower["chroma"], "ChromaDB", "Vector index\nLegal chunks\nSemantic search", WHITE)
    label(draw, lower["llm"], "AI Providers", "Gemini / Groq / HF\nWhisper STT\nUrdu TTS", WHITE)
    label(draw, lower["fire"], "Firestore", "Queries\nLawyers\nKnowledge base", WHITE)
    label(draw, lower["lawyer"], "Directory", "Verified lawyers\nCity filters\nWhatsApp contact", WHITE)

    arrow(draw, (325, 790), (720, 560), color=GREEN, width=6)
    arrow(draw, (785, 790), (1655, 560), color=GREEN, width=6)
    arrow(draw, (1245, 790), (1655, 560), color=GREEN, width=6)
    arrow(draw, (1705, 790), (1195, 560), color=BLUE, width=6)
    arrow(draw, (2140, 790), (2110, 560), color=GOLD, width=6)

    # Safety strip
    round_rect(draw, (120, 1165, 2280, 1345), 28, NAVY, outline=NAVY, width=1)
    draw.text((165, 1205), "Built-in Safety Boundary", font=font(34, True), fill=WHITE)
    safety = [
        "General legal information only",
        "Grounded in retrieved legal sources",
        "Persistent disclaimer in UI",
        "Consult lawyer for personal cases",
    ]
    x = 165
    for item in safety:
        pill(draw, (x, 1265, x + 485, 1318), item, GREEN)
        x += 520

    # Footer
    draw.text(
        (120, 1410),
        "Recommended placement: Chapter 1 / Introduction as Figure 1, before detailed architecture diagrams.",
        font=F_SMALL,
        fill=GRAY,
    )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, quality=95)
    print(OUT)


if __name__ == "__main__":
    main()
