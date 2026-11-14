"""
ExamIQ - Legacy Tamil Font to Unicode Converter
Supports BAMINI, Vanavil, TAB, and TAM typography encodings used in
official Tamil Nadu Directorate of Government Examinations (DGE) question papers.
"""

import re
from typing import Optional


# Compound prefixes and ligatures
LIGATURE_MAP = {
    # Special compound letters
    "[Q": "ங்கி",
    "§": "பூ",
    "•": "மு",
    "‰": "மூ",
    "²": "யு",
    "³": "யூ",
    "¸": "ரு",
    "¹": "ரூ",
    "¾": "லு",
    "¿": "லூ",
    "Ä": "வு",
    "Å": "வூ",
    "Ê": "ழு",
    "Ë": "ழூ",
    "Ð": "ளு",
    "Ñ": "ளூ",
    "Ö": "று",
    "×": "றூ",
    "q": "ஃ",
    "`": "சூ",
    "_": "சு",
    "k": "டு",
    "m": "ட்",
    "T": "கூ",
    "S": "கு",
    "x": "து",
    "y": "தூ",
    "¦": "பு",
    "â": "ஜி",
    "á": "ஞ",
    "ê": "ஷ",
    "ë": "ஷி",
    "ì": "ஷீ",
    "í": "ஷு",
    "î": "ஷூ",
    "ï": "ஹ",
}

CONSONANT_MAP = {
    "P": "க",
    "[": "ங",
    "\\": "ச",
    "g": "ஞ",
    "h": "ட",
    "n": "ண",
    "u": "த",
    "|": "ந",
    "£": "ப",
    "©": "ம",
    "¯": "ய",
    "µ": "ர",
    "»": "ல",
    "Á": "வ",
    "Ç": "ழ",
    "Í": "ள",
    "Ó": "ற",
    "Ú": "ன",
    "á": "ஞ",
}

DIRECT_MAP = {
    # Mei (consonants + pulli/virama)
    "U": "க்",
    "a": "ச்",
    "m": "ட்",
    "s": "ண்",
    "z": "த்",
    "¢": "ந்",
    "¨": "ப்",
    "®": "ம்",
    "´": "ய்",
    "º": "ர்",
    "À": "ல்",
    "Æ": "வ்",
    "Ì": "ழ்",
    "Ò": "ள்",
    "Ø": "ற்",
    "ß": "ன்",
    "g;": "ஞ்",
    # Uyir (Vowels)
    "A": "அ",
    "B": "ஆ",
    "C": "இ",
    "D": "ஈ",
    "E": "உ",
    "F": "ஊ",
    "G": "எ",
    "H": "ஏ",
    "I": "ஐ",
    "J": "ஒ",
    "K": "ஓ",
    "L": "ஔ",
    # I / II vowel markers
    "Q": "கி",
    "R": "கீ",
    "]": "சி",
    "^": "சீ",
    "i": "டி",
    "j": "டீ",
    "o": "ணி",
    "p": "ணீ",
    "v": "தி",
    "w": "தீ",
    "{": "நி",
    "|i": "நீ",
    "¤": "பி",
    "¥": "பீ",
    "ª": "மி",
    "«": "மீ",
    "°": "யி",
    "±": "யீ",
    "›": "ரி",
    "œ": "ரீ",
    "¼": "லி",
    "½": "லீ",
    "Â": "வி",
    "Ã": "வீ",
    "È": "ழி",
    "É": "ழீ",
    "Î": "ளி",
    "Ï": "ளீ",
    "Ô": "றி",
    "Õ": "றீ",
    "Û": "னி",
    "Ü": "னீ",
    # Standalone consonants
    "P": "க",
    "[": "ங",
    "\\": "ச",
    "g": "ஞ",
    "h": "ட",
    "n": "ண",
    "u": "த",
    "|": "ந",
    "£": "ப",
    "©": "ம",
    "¯": "ய",
    "µ": "ர",
    "»": "ல",
    "Á": "வ",
    "Ç": "ழ",
    "Í": "ள",
    "Ó": "ற",
    "Ú": "ன",
}


def convert_bamini_to_unicode(text: Optional[str]) -> str:
    """
    Converts a BAMINI/Vanavil/TAB encoded string into pure Unicode Tamil.
    If the string is already predominantly Unicode Tamil, returns it untouched.
    """
    if not text:
        return ""

    # If already native Unicode Tamil
    tamil_count = sum(1 for c in text if "\u0b80" <= c <= "\u0bff")
    if tamil_count > 15 and tamil_count > len(text) * 0.4:
        return text.strip()

    t = text

    # Step 1: Pre-process known multi-char ligatures
    for k, v in LIGATURE_MAP.items():
        t = t.replace(k, v)

    # Step 2: Handle Kombu Re-ordering (kombu placed before consonant in legacy font)
    # ö<C>õ -> <C>ொ
    # ÷<C>õ -> <C>ோ
    # ö<C>Í -> <C>ௌ
    # ö<C> -> <C>ெ
    # ÷<C> -> <C>ே
    # ø<C> -> <C>ை
    # <C>õ -> <C>ா
    for k, v in CONSONANT_MAP.items():
        t = t.replace(f"ö{k}õ", f"{v}ொ")
        t = t.replace(f"÷{k}õ", f"{v}ோ")
        t = t.replace(f"ö{k}Í", f"{v}ௌ")
        t = t.replace(f"ö{k}", f"{v}ெ")
        t = t.replace(f"÷{k}", f"{v}ே")
        t = t.replace(f"ø{k}", f"{v}ை")
        t = t.replace(f"{k}õ", f"{v}ா")

    # Step 3: Handle direct character mappings
    for k, v in DIRECT_MAP.items():
        t = t.replace(k, v)

    # Clean up artifacts like leftover hyphens between syllables
    t = re.sub(r"([\u0b80-\u0bff])-([\u0b80-\u0bff])", r"\1\2", t)
    t = re.sub(r"[ ]{2,}", " ", t)

    return t.strip()

