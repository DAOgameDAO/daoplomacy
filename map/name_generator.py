import random

ALPHABET = "abcdefghijklmnopqrstuvwxyz"
ORIGINAL_NAMES = [
    "ank",
    "arm",
    "con",
    "mos",
    "sev",
    "stp",
    "syr",
    "ukr",
    "lvn",
    "war",
    "pru",
    "sil",
    "ber",
    "kie",
    "ruh",
    "mun",
    "rum",
    "gre",
    "smy",
    "alb",
    "ser",
    "bud",
    "gal",
    "vie",
    "boh",
    "tyr",
    "tri",
    "fin",
    "swe",
    "nwy",
    "den",
    "hol",
    "bel",
    "swi",
    "ven",
    "pie",
    "tus",
    "rom",
    "apu",
    "nap",
    "bur",
    "mar",
    "gas",
    "pic",
    "par",
    "bre",
    "spa",
    "por",
    "naf",
    "tun",
    "lon",
    "wal",
    "lvp",
    "yor",
    "edi",
    "cly",
    "nao",
    "nwg",
    "bar",
    "bot",
    "bal",
    "ska",
    "hel",
    "nth",
    "eng",
    "iri",
    "mao",
    "wes",
    "lyo",
    "tys",
    "adr",
    "ion",
    "aeg",
    "eas",
    "bla",
]


def get_char_freqs(s):
    freqs = [0] * len(ALPHABET)
    for c in s:
        freqs[ALPHABET.index(c)] += 1

    # ensure no character has frequency zero
    min_freq = min(freqs)
    for i in range(len(ALPHABET)):
        freqs[i] = max(freqs[i], min_freq)

    return freqs


def generate_name(freqs):
    chars = random.choices(ALPHABET, weights=freqs, k=3)
    return "".join(chars).upper()


if __name__ == "__main__":
    char_freqs = get_char_freqs("".join(ORIGINAL_NAMES))
    for _ in range(10):
        print(generate_name(char_freqs))
