#!/usr/bin/env bash
# Pack the private archive/ directory into a dated tarball and print its sha256.
# Run when a post goes live; publish the printed hash (not the tarball) with the post.
set -euo pipefail

name="${1:?usage: pack-archive.sh <investigation-slug>}"
cd "$(dirname "$0")/.."
[ -d archive ] || { echo "no archive/ directory" >&2; exit 1; }

out="archive-${name}-$(date -u +%Y%m%d).tar.gz"
shasum -a 256 archive/sources/* > archive/SHA256SUMS
tar -czf "$out" archive
shasum -a 256 "$out"
