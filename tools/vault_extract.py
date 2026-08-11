#!/usr/bin/env python3
"""
Разбор PDF-книг Vault of Ages в структуру записей data.js.

Работает с вашими собственными файлами: читает PDF, режет двухколоночную
вёрстку по координатам слов и собирает записи вида

    {id, src, kind, roll, tier, recall, weapon, en, ende, ru, rud, img}

где ru/rud остаются пустыми — их вы заполняете переводом.

Запуск:
    python3 tools/vault_extract.py Vol1.pdf Vol2.pdf Vol3.pdf -o vault.json
    python3 tools/vault_extract.py Vol3.pdf --format md -o vault3.md
    python3 tools/vault_extract.py *.pdf --lint        # только проверки, без вывода

Зависимость: poppler-utils (pdftotext). Питоновских пакетов не нужно.
"""
import argparse, json, re, sys, unicodedata
from pathlib import Path

import subprocess, xml.etree.ElementTree as ET

CATEGORIES = ["Consumable", "Loot", "Armor", "Primary Weapon", "Secondary Weapon"]
CAT_RE = re.compile(r"^(%s)(\s*[-\u2013]\s*(?P<sub>[\w' ]+))?$" % "|".join(CATEGORIES))
TIER_RE = re.compile(r"TIER\s+(\d)\s*(?:\(([A-Z ]+)\))?\s*ITEMS", re.I)
RECALL_RE = re.compile(r"Recall\s+Cost:?\s*(\d+)", re.I)
STATS_RE = re.compile(r"Trait:\s*(?P<trait>\w+)[,;]?\s*Range:\s*(?P<range>[\w ]+?)[,;]?\s*Burden:\s*(?P<burden>[\w-]+)", re.I)
DMG_RE = re.compile(r"Damage:\s*(?P<dmg>\d*d\d+(?:\+\d+)?)\s*(?P<type>physical|magic|phy|mag)?", re.I)
ARMOR_RE = re.compile(r"Armor\s+Score:?\s*(?P<score>\d+)", re.I)
THRESH_RE = re.compile(r"(?:Minor\s+Threshold:?\s*(?P<minor>\d+).{0,4}Major\s+Threshold:?\s*(?P<major>\d+)"
                       r"|Damage\s+Thresholds?:?\s*(?P<a>\d+)\s*/\s*(?P<b>\d+))", re.I)

# служебные заголовки, которые не являются предметами
SKIP_HEADINGS = {"CREDITS", "INTRODUCTION", "PRINTABLE CARDS", "RARITY", "ARTIFACTS",
                 "RARITY TIER COLOR", "LOOT DESCRIPTION"}
SKIP_RE = re.compile(r"^(VERSION|THE VAULT OF AGES|RULE\s*:|TIER\b|\d+\s*$)", re.I)

# ---------------------------------------------------------------- вёрстка
#
# pdfplumber на этих файлах отдаёт цифры как глифы приватной области Unicode:
# у сабсетов шрифта сломана таблица ToUnicode, и «d8+1» превращается в «d\ue53d+\ue536».
# poppler такие глифы разрешает правильно, поэтому берём pdftotext -bbox-layout:
# он даёт и корректный текст, и координаты слов, нужные для резки колонок.

def page_words(pdf_path):
    """[(page_no, x0, x1, top, text)] по всему файлу."""
    xml = subprocess.run(["pdftotext", "-bbox-layout", pdf_path, "-"],
                         capture_output=True, text=True).stdout
    xml = re.sub(r'\sxmlns="[^"]+"', "", xml, count=1)
    root = ET.fromstring(xml)
    out = []
    for pno, page in enumerate(root.iter("page"), 1):
        w = float(page.get("width"))
        for word in page.iter("word"):
            out.append((pno, w, float(word.get("xMin")), float(word.get("xMax")),
                        float(word.get("yMin")), (word.text or "").strip()))
    return [r for r in out if r[-1]]


def split_columns(words, min_share=0.12):
    """Режет слова страницы на колонки.

    Заголовки разворота тянутся через обе колонки, поэтому «полностью пустых»
    вертикальных полос на странице обычно нет — искать надо не пустоту, а
    минимум плотности в средней трети. Слова шире трети страницы (заголовки,
    таблицы) из подсчёта исключаются.
    """
    if not words:
        return []
    width = words[0][1]
    body = [w for w in words if (w[3] - w[2]) < width / 3]
    if not body:
        return [words]

    step = 5.0
    n = int(width / step) + 2
    bins = [0] * n
    for w in body:
        b = int(((w[2] + w[3]) / 2) / step)
        if 0 <= b < n:
            bins[b] += 1

    lo, hi = int(width * 0.35 / step), int(width * 0.65 / step)
    if hi <= lo:
        return [words]
    window = bins[lo:hi]
    peak = max(bins) or 1
    # самый длинный участок низкой плотности в средней трети
    best, run_start, best_len = None, None, 0
    for i, c in enumerate(window, lo):
        if c <= peak * min_share:
            run_start = i if run_start is None else run_start
        else:
            if run_start is not None and i - run_start > best_len:
                best, best_len = (run_start, i), i - run_start
            run_start = None
    if run_start is not None and (hi - run_start) > best_len:
        best = (run_start, hi)
    if best is None:
        return [words]

    cut = (best[0] + best[1]) / 2 * step
    left = [w for w in words if (w[2] + w[3]) / 2 < cut]
    right = [w for w in words if (w[2] + w[3]) / 2 >= cut]
    return [c for c in (left, right) if c]


def words_to_lines(words, y_tol=3.0):
    lines, cur, top = [], [], None
    for w in sorted(words, key=lambda w: (round(w[4], 1), w[2])):
        if top is None or abs(w[4] - top) <= y_tol:
            cur.append(w)
            top = w[4] if top is None else top
        else:
            lines.append(" ".join(x[5] for x in sorted(cur, key=lambda x: x[2])))
            cur, top = [w], w[4]
    if cur:
        lines.append(" ".join(x[5] for x in sorted(cur, key=lambda x: x[2])))
    return [l.strip() for l in lines if l.strip()]


def book_lines(pdf_path):
    """Строки книги в порядке чтения: страница -> колонка -> строка."""
    allw = page_words(pdf_path)
    pages = {}
    for r in allw:
        pages.setdefault(r[0], []).append(r)
    out = []
    for pno in sorted(pages):
        for col in split_columns(pages[pno]):
            for line in words_to_lines(col):
                out.append((pno, line))
    return out

# ---------------------------------------------------------------- разбор

def is_name(line):
    letters = [c for c in line if c.isalpha()]
    if len(letters) < 3:
        return False
    if not all(c.isupper() for c in letters):
        return False
    if TIER_RE.search(line) or SKIP_RE.match(line.strip()):
        return False
    if line.strip().upper() in SKIP_HEADINGS:
        return False
    return len(line) <= 46

def slugify(name):
    s = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def parse(pdf_path, vol_hint=None):
    lines = book_lines(pdf_path)
    vol = vol_hint or re.search(r"Vol(?:ume)?[ _]?(\d)", Path(pdf_path).name, re.I)
    vol = vol if isinstance(vol, str) else (vol.group(1) if vol else "?")

    items, cur, tier = [], None, None
    for pno, line in lines:
        m = TIER_RE.search(line)
        if m:
            tier = int(m.group(1)) if m.group(1).isdigit() else None
            continue
        if is_name(line):
            if cur:
                items.append(cur)
            cur = {"vol": vol, "page": pno, "tier": tier, "name": line.strip(),
                   "category": None, "subtype": None, "recall": None,
                   "weapon": {}, "armor": {}, "body": []}
            continue
        if cur is None:
            continue
        cm = CAT_RE.match(line.strip())
        if cm and cur["category"] is None:
            cur["category"] = cm.group(1)
            cur["subtype"] = (cm.groupdict().get("sub") or "").strip() or None
            continue
        rm = RECALL_RE.search(line)
        if rm and cur["recall"] is None:
            cur["recall"] = int(rm.group(1))
            if RECALL_RE.sub("", line).strip(" ,.;") == "":
                continue
        sm = STATS_RE.search(line)
        if sm:
            cur["weapon"].update({k: v.strip() for k, v in sm.groupdict().items() if v})
            continue
        dm = DMG_RE.search(line)
        if dm:
            cur["weapon"]["damage"] = dm.group("dmg")
            if dm.group("type"):
                cur["weapon"]["damage_type"] = dm.group("type").lower()
            continue
        am = ARMOR_RE.search(line)
        tm = THRESH_RE.search(line)
        if am or tm:
            if am:
                cur["armor"]["score"] = int(am.group("score"))
            if tm:
                g = tm.groupdict()
                lo = g.get("minor") or g.get("a")
                hi = g.get("major") or g.get("b")
                if lo and hi:
                    cur["armor"]["thresholds"] = f"{lo}/{hi}"
            continue
        cur["body"].append(line)
    if cur:
        items.append(cur)

    for it in items:
        it["ende"] = re.sub(r"\s+", " ", " ".join(it["body"])).strip()
        del it["body"]
        it["en"] = " ".join(w.capitalize() if w.isupper() else w
                            for w in it["name"].split())
    return items

# ---------------------------------------------------------------- проверки

def lint(items):
    issues = []
    by_name = {}
    for it in items:
        key = re.sub(r"\s+", "", it["en"].lower())
        by_name.setdefault(key, []).append(it)

    for it in items:
        tag = f'{it["vol"]}/p{it["page"]} {it["en"]}'
        if it["category"] is None:
            issues.append((tag, "не определилась категория"))
        if it["category"] == "Consumable" and it["recall"] is not None:
            issues.append((tag, f'Consumable со Стоимостью Призыва {it["recall"]} — вероятно, Loot'))
        if re.search(r"once per day", it["ende"], re.I):
            issues.append((tag, '«once per day» — в Daggerheart нет суток, нужен отдых или сессия'))
        if re.search(r"\bhitpoint", it["ende"], re.I):
            issues.append((tag, '«Hitpoint» — в ядре «Hit Point»'))
        if re.search(r"\breaction roll", it["ende"]):
            issues.append((tag, '«reaction roll» строчными — в ядре с прописных'))
        if re.search(r"\bspellcast roll", it["ende"]):
            issues.append((tag, '«spellcast roll» строчными — в ядре с прописных'))
        if "**" in it["ende"]:
            issues.append((tag, "неотрендеренная разметка markdown в тексте"))
        if it["category"] in ("Primary Weapon", "Secondary Weapon") and not it["weapon"].get("damage"):
            issues.append((tag, "оружие без строки Damage"))
        if it["category"] == "Armor" and not it["armor"].get("thresholds"):
            issues.append((tag, "броня без порогов урона"))

    for key, group in by_name.items():
        names = {g["en"] for g in group}
        if len(names) > 1:
            issues.append((", ".join(sorted(names)), "один предмет под разными написаниями"))
    return issues

# ---------------------------------------------------------------- вывод

def to_records(items, start_id=1, prefix="v"):
    out = []
    for n, it in enumerate(items, start_id):
        rec = {
            "id": f'{prefix}{n}',
            "src": f'vault{it["vol"]}',
            "kind": "consumable" if it["category"] == "Consumable" else "item",
            "roll": n,
            "tier": it["tier"],
            "recall": it["recall"],
            "en": it["en"],
            "ende": it["ende"],
            "ru": "",
            "rud": "",
            "img": f'{prefix}{n}.webp',
        }
        if it["weapon"]:
            rec["weapon"] = it["weapon"]
        if it["armor"]:
            rec["armor"] = it["armor"]
        out.append(rec)
    return out

def to_md(items):
    lines, tier = [], object()
    for it in items:
        if it["tier"] != tier:
            tier = it["tier"]
            lines.append(f'\n## Tier {tier}\n' if tier else '\n## —\n')
        head = f'### {it["en"]}'
        lines.append(head)
        meta = [x for x in [it["category"], it["subtype"],
                            f'Recall Cost: {it["recall"]}' if it["recall"] is not None else None] if x]
        if meta:
            lines.append("*" + " · ".join(meta) + "*")
        if it["weapon"]:
            lines.append("`" + ", ".join(f'{k}: {v}' for k, v in it["weapon"].items()) + "`")
        if it["armor"]:
            lines.append("`" + ", ".join(f'{k}: {v}' for k, v in it["armor"].items()) + "`")
        lines.append(it["ende"])
        lines.append("")
    return "\n".join(lines)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("pdfs", nargs="+")
    ap.add_argument("-o", "--out")
    ap.add_argument("--format", choices=["json", "md"], default="json")
    ap.add_argument("--prefix", default="v", help="префикс id (по умолчанию v)")
    ap.add_argument("--lint", action="store_true", help="только проверки")
    args = ap.parse_args()

    allitems = []
    for p in args.pdfs:
        allitems += parse(p)

    problems = lint(allitems)
    print(f"Разобрано записей: {len(allitems)}", file=sys.stderr)
    print(f"Замечаний: {len(problems)}", file=sys.stderr)
    for tag, msg in problems:
        print(f"  {tag}: {msg}", file=sys.stderr)
    if args.lint:
        return

    data = to_md(allitems) if args.format == "md" else json.dumps(
        to_records(allitems, prefix=args.prefix), ensure_ascii=False, indent=1)
    if args.out:
        Path(args.out).write_text(data, encoding="utf-8")
        print(f"Записано в {args.out}", file=sys.stderr)
    else:
        print(data)

if __name__ == "__main__":
    main()
