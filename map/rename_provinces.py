import os
import sys
import re


MAPPING_PATH = os.path.join(os.path.dirname(__file__), "provinces")
TMP_PATH = os.path.join(os.path.dirname(__file__), "tmp")


def load_mapping(path):
    with open(path) as f:
        lines = f.readlines()
    m = {}
    for line in lines:
        if not line.strip():
            continue
        parts = line.split()
        assert(len(parts) == 3)
        m[parts[0]] = parts[2]
    return m


def make_replacement_regex(s):
    r = r"(?<!\w)(" + s + r")(?!\w)"
    return re.compile(r)


def replace(s, m):
    for k, v in m.items():
        s = re.sub(make_replacement_regex(k.upper()), v.upper(), s)
        s = re.sub(make_replacement_regex(k.lower()), v.lower(), s)
    return s


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python rename_provinces.py <input-file>")
        sys.exit(1)

    input_path = sys.argv[1]
    print(f"renaming in {input_path}")
    
    m = load_mapping(MAPPING_PATH)
    with open(input_path) as f:
        s = f.read()
    s = replace(s, m)

    with open(TMP_PATH, "x") as f:
        f.write(s)
    os.rename(TMP_PATH, input_path)
