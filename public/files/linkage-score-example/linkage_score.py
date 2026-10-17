#!/usr/bin/env python3
"""Pairwise agent similarity two ways (standard library only).

MO view:        Jaccard over each agent's event-type trigrams (what it does, in order).
Signature view: Jaccard over each agent's non-empty markers (what it does for no task reason).

Usage: python linkage_score.py swarm_timeline.csv [--top 10] [--min-events 5]
"""
import argparse
import csv
from collections import defaultdict
from itertools import combinations


def load(path, min_events):
    events = defaultdict(list)
    with open(path, newline="") as fh:
        for r in csv.DictReader(fh):
            events[r["agent_id"]].append((int(r["t_s"]), r["event"], r["marker"]))
    trigrams, markers = {}, {}
    for agent, evs in events.items():
        if len(evs) < min_events:
            continue
        evs.sort()
        seq = [e for _, e, _ in evs]
        trigrams[agent] = {tuple(seq[i : i + 3]) for i in range(len(seq) - 2)}
        markers[agent] = {m for _, _, m in evs if m}
    return trigrams, markers


def jaccard(a, b):
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)


def rank(sets, top):
    pairs = {(x, y): jaccard(sets[x], sets[y]) for x, y in combinations(sorted(sets), 2)}
    return pairs, sorted(pairs.items(), key=lambda kv: (-kv[1], kv[0]))[:top]


def show(title, ranked):
    print(f"== {title} ==")
    for (x, y), s in ranked:
        print(f"{x}  {y}  {s:.3f}")
    print()


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("csv")
    ap.add_argument("--top", type=int, default=10)
    ap.add_argument("--min-events", type=int, default=5)
    args = ap.parse_args()

    trigrams, markers = load(args.csv, args.min_events)
    mo_all, mo_top = rank(trigrams, args.top)
    sig_sets = {a: m for a, m in markers.items() if m}
    sig_all, sig_top = rank(sig_sets, args.top)

    show("MO view (event-type trigrams)", mo_top)
    show("Signature view (markers)", sig_top)

    print("== Disagreements: top signature pairs with low MO similarity ==")
    for (x, y), s in sig_top:
        mo = mo_all.get((x, y), 0.0)
        if mo < 0.2:
            print(f"{x}  {y}  signature={s:.3f}  mo={mo:.3f}")


if __name__ == "__main__":
    main()
