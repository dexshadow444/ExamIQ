"""
Unified Launcher for JM Vertex ExamIQ
Runs both the FastAPI Backend (Port 8000) and Flask Frontend (Port 3000) concurrently.
Usage:
    python run_all.py
"""

import os
import signal
import subprocess
import sys
import time


def main():
    print("=" * 70)
    print("🚀 JM Vertex ExamIQ — Full Stack Launcher")
    print("=" * 70)
    print("Starting Backend & Frontend services...")

    python_executable = sys.executable

    # 1. Start FastAPI Backend on port 8000
    backend_proc = subprocess.Popen(
        [python_executable, "run_backend.py"],
        stdout=None,
        stderr=None
    )
    print("  [Backend]  Starting FastAPI on http://localhost:8000 ...")

    # Give backend a moment to initialize
    time.sleep(1.5)

    # 2. Start Flask Frontend on port 3000
    frontend_proc = subprocess.Popen(
        [python_executable, "app.py"],
        stdout=None,
        stderr=None
    )
    print("  [Frontend] Starting Frontend Server on http://localhost:3000 ...")

    print("\n" + "=" * 70)
    print("✅ All services are running:")
    print("   🌐 Frontend Portal : http://localhost:3000")
    print("   ⚡ FastAPI Backend  : http://localhost:8000/api/v1")
    print("   📖 Swagger Docs    : http://localhost:8000/docs")
    print("   📑 ReDoc           : http://localhost:8000/redoc")
    print("=" * 70)
    print("Press Ctrl+C to stop both servers.\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            if backend_proc.poll() is not None:
                print("⚠️ Backend server process stopped.")
                break
            if frontend_proc.poll() is not None:
                print("⚠️ Frontend server process stopped.")
                break
    except KeyboardInterrupt:
        print("\nStopping ExamIQ services...")
    finally:
        for proc, name in [(backend_proc, "Backend"), (frontend_proc, "Frontend")]:
            if proc and proc.poll() is None:
                try:
                    proc.terminate()
                    proc.wait(timeout=3)
                except Exception:
                    proc.kill()
                print(f"  Stopped {name}")
        print("Done. Goodbye!")


if __name__ == "__main__":
    main()

