#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Care Tracker ==="
echo "Backend:  http://localhost:8765"
echo "Frontend: http://localhost:5173"
echo ""

python3 -m uvicorn server.main:app --host 0.0.0.0 --port 8765 &
BACKEND_PID=$!

cd "$DIR/web" && npx vite --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
