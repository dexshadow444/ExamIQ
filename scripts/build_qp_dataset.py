"""
ExamIQ - Past Exam Question Paper Ingestion CLI Runner
Usage:
    python scripts/build_qp_dataset.py [--force] [--limit N]
"""

import argparse
import os
import sys
import time

# Ensure project root is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.services.qp_ingest import ingest_all, get_dataset_status


def main():
    parser = argparse.ArgumentParser(description="ExamIQ - Ingest Past Exam Papers into Question Bank")
    parser.add_argument("--force", action="store_true", help="Force re-ingestion of all files bypassing manifest")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of PDFs to process for quick testing")
    args = parser.parse_args()

    print("=" * 75)
    print("📚 JM Vertex ExamIQ — Past Exam Question Paper Ingestion Pipeline")
    print("=" * 75)
    print(f"Force re-ingest : {args.force}")
    if args.limit:
        print(f"File limit      : {args.limit}")
    print("Scanning 'qp dataset/' directory...\n")

    start_time = time.time()
    status = ingest_all(force=args.force, max_files=args.limit)
    elapsed = time.time() - start_time

    print("\n" + "=" * 75)
    print(f"✅ Ingestion Completed in {elapsed:.2f} seconds")
    print("=" * 75)
    print(f"Total PDFs Discovered         : {status.get('total_files_found', 0)}")
    print(f"PDFs Ingested in Manifest     : {status.get('files_ingested', 0)}")
    print(f"Canonical Questions Stored    : {status.get('total_canonical_questions', 0)}")
    print(f"Repeated Questions Identified : {status.get('repeated_questions_detected', 0)}")
    print(f"Diagram Questions Flagged     : {status.get('questions_with_diagrams', 0)}")
    print(f"Low-Confidence Review Items   : {status.get('needs_review_count', 0)}")

    print("\n📊 Questions by Year:")
    for yr, count in status.get("questions_by_year", {}).items():
        print(f"   • {yr:4s} : {count:4d} questions")

    print("\n📖 Questions by Subject:")
    for subj, count in status.get("questions_by_subject", {}).items():
        print(f"   • {subj:25s} : {count:4d} questions")

    print("\n🏷️ Questions by Marks Distribution:")
    for m_label, count in status.get("questions_by_marks", {}).items():
        print(f"   • {m_label:10s} : {count:4d} questions")

    failed = status.get("failed_files", [])
    if failed:
        print("\n⚠️ Failed Files:")
        for f in failed:
            print(f"   ❌ {f.get('file')}: {f.get('error')}")
    else:
        print("\n🎉 All processed files parsed cleanly without critical failures.")

    print("=" * 75)


if __name__ == "__main__":
    main()

