#!/usr/bin/env bash
# Replays tutorial posts in a fresh container, one container per post.
#
#   tests/tutorials/run.sh                 every post listed in posts.txt
#   tests/tutorials/run.sh path/to/post.mdx
#   tests/tutorials/run.sh --fix [post.mdx...]
#                                          gofmt the Go fences in place instead
#
# Uses podman if it is installed, docker otherwise; CONTAINER_ENGINE overrides.
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
root=$(cd "$here/../.." && pwd)

engine=${CONTAINER_ENGINE:-}
if [ -z "$engine" ]; then
  if command -v podman >/dev/null; then engine=podman; else engine=docker; fi
fi
image=moroz-dev-tutorials

fix=0
if [ "${1:-}" = "--fix" ]; then
  fix=1
  shift
fi

"$engine" build --quiet --tag "$image" --file "$here/Containerfile" "$here" >/dev/null

if [ $# -gt 0 ]; then
  posts=("$@")
else
  mapfile -t posts < <(grep -v -e '^#' -e '^$' "$here/posts.txt")
fi

failed=0
for post in "${posts[@]}"; do
  path=$(realpath "$post" 2>/dev/null || realpath "$root/$post")
  echo "### ${path#"$root"/}"
  if [ "$fix" = 1 ]; then
    "$engine" run --rm --network=none --volume "$path:/post.mdx:z" \
      --entrypoint tutorial-runner "$image" -fix /post.mdx || failed=1
  elif ! "$engine" run --rm --network=none \
      --volume "$path:/post.mdx:ro,z" "$image"; then
    failed=1
  fi
  echo
done
exit "$failed"
