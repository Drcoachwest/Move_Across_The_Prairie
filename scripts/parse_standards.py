import pdfplumber, re, json
from pathlib import Path


def num(x):
    if x is None:
        return None
    x = str(x).strip()
    if x == "":
        return None
    if ":" in x:
        return x
    try:
        return float(x)
    except Exception:
        return None


def parse_page(page):
    tables = page.extract_tables()
    t = tables[0] if tables else []
    cardio = {}
    muscular = {}
    for row in t:
        if not row or not row[0]:
            continue
        age = str(row[0]).strip()
        if not re.match(r"^\d+\+?$", age):
            continue
        values = [num(c) for c in row[1:]]
        if any(isinstance(v, str) and ":" in v for v in values):
            v = values
            def to_float(val):
                return val if isinstance(val, (int, float)) else None
            bmi_min = None
            bmi_max = None
            if to_float(v[12]) is not None:
                bmi_min = min(to_float(v[12]), to_float(v[13]) or to_float(v[12]))
                bmi_max = max(to_float(v[12]), to_float(v[13]) or to_float(v[12]))
            cardio[age] = {
                "pacer20": {"min": to_float(v[2]), "max": to_float(v[3])},
                "bmi": {"min": bmi_min, "max": bmi_max},
            }
        else:
            nums = [v for v in values if isinstance(v, (int, float))]
            if len(nums) >= 11:
                curl_low, curl_high, trunk_low, trunk_high, push_low, push_high, modpull_low, modpull_high, hang_low, hang_high, sitreach_min = nums[:11]
                muscular[age] = {
                    "curlup": {"min": curl_low, "max": curl_high},
                    "trunkLift": {"min": trunk_low, "max": trunk_high},
                    "pushup90": {"min": push_low, "max": push_high},
                    "sitAndReach": {"min": sitreach_min},
                }
    return cardio, muscular


def main():
    pdf_path = Path("/tmp/StandardsTable.pdf")
    if not pdf_path.exists():
        raise SystemExit("PDF not found at /tmp/StandardsTable.pdf")

    standards = {"boys": {}, "girls": {}}
    with pdfplumber.open(str(pdf_path)) as pdf:
        cardio_b, muscular_b = parse_page(pdf.pages[0])
        cardio_g, muscular_g = parse_page(pdf.pages[1])

    standards["boys"]["cardio"] = cardio_b
    standards["boys"]["muscular"] = muscular_b
    standards["girls"]["cardio"] = cardio_g
    standards["girls"]["muscular"] = muscular_g

    out_path = Path("/Users/michael/move across the prairie/src/lib/fitnessgram-standards.json")
    out_path.write_text(json.dumps(standards, indent=2))
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
