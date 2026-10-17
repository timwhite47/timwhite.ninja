#!/usr/bin/env python3
"""Generate a synthetic swarm event timeline (standard library only).

Every value is a random draw. Nothing here is derived from any real incident.
"""
import argparse
import csv
import random

EVENTS_BOARD = ["join", "post", "reply", "read"]
EVENTS_HF = ["probe", "request"]
OUTCOMES = ["ok", "blocked", "error"]
OUTCOME_WEIGHTS = [0.8, 0.12, 0.08]
DAY = 86400


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--agents", type=int, default=1200)
    ap.add_argument("--attackers", type=int, default=700)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--events-per-agent", type=int, default=10)
    ap.add_argument("--out", default="swarm_timeline.csv")
    args = ap.parse_args()
    if args.attackers > args.agents:
        ap.error("--attackers must be <= --agents")

    rng = random.Random(args.seed)
    rows = []
    for i in range(1, args.agents + 1):
        agent = f"A{i:04d}"
        attacker = i <= args.attackers
        marker = rng.choice([f"m{k}" for k in range(1, 7)]) if rng.random() < 0.3 else ""
        join_t = rng.randrange(0, DAY // 3)
        rows.append((join_t, agent, "join", "board", f"T{rng.randint(1, 40):03d}", "ok", ""))
        for _ in range(args.events_per_agent - 1):
            if attacker and rng.random() < 0.5:
                t = rng.randrange(DAY // 2, DAY)
                ev, target = rng.choice(EVENTS_HF), "hf"
            else:
                t = rng.randrange(join_t, DAY * 2 // 3)
                ev, target = rng.choice(EVENTS_BOARD[1:]), "board"
            outcome = rng.choices(OUTCOMES, OUTCOME_WEIGHTS)[0]
            m = marker if ev in ("post", "reply") else ""
            rows.append((t, agent, ev, target, f"T{rng.randint(1, 40):03d}", outcome, m))

    rows.sort(key=lambda r: (r[0], r[1]))
    with open(args.out, "w", newline="") as fh:
        w = csv.writer(fh, lineterminator="\n")
        w.writerow(["t_s", "agent_id", "event", "target", "thread_id", "outcome", "marker"])
        w.writerows(rows)


if __name__ == "__main__":
    main()
