"""
JM Vertex ExamIQ — Frontend Web Server (HTML / CSS / JS + Python)
----------------------------------------------------------------
Serves ONLY the frontend application (HTML templates + static CSS/JS assets)
and injects backend integration configuration for the browser client.
All business data persistence and AI/OCR processing live in the separate
backend server (configured via API_BASE_URL).
"""

import os
from dotenv import load_dotenv
from flask import Flask, render_template

load_dotenv()

app = Flask(__name__, template_folder="templates", static_folder="static")


def get_frontend_config() -> dict:
    """Build runtime configuration injected into the frontend HTML shell."""
    return {
        "apiBaseUrl": os.getenv("API_BASE_URL", "http://localhost:8000/api/v1"),
        "emisClientId": os.getenv("EMIS_CLIENT_ID", "emis_tn_prod_hsc_492"),
        "emisAuthUrl": os.getenv(
            "EMIS_AUTH_URL", "https://emis.tnschools.gov.in/oauth/authorize"
        ),
        "appVersion": "TN-HSC-EXAMIQ-v2.1",
    }


@app.route("/")
@app.route("/<path:subpath>")
def index(subpath=None):
    """Serve the single-page frontend shell for all frontend routes."""
    return render_template("index.html", config=get_frontend_config())


if __name__ == "__main__":
    port = int(os.getenv("FRONTEND_PORT", "3000"))
    app.run(host="127.0.0.1", port=port, debug=False)
