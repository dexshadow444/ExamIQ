"""
Vocational Education Intelligence Router
"""

from fastapi import APIRouter
from backend.database import db

router = APIRouter(prefix="/vocational", tags=["Vocational Education Intelligence"])


@router.get("", summary="List All Vocational Trade Modules")
async def list_vocational_trades():
    """
    Returns vocational trades with practical workshop rubrics and competencies.
    """
    return db.vocational


@router.get("/{trade_code}", summary="Get Vocational Trade Modules & Workshop Rubrics")
async def get_vocational_trade(trade_code: str = "452"):
    """
    Retrieves trade syllabus, practical rubrics, and skill assessment logs.
    """
    trade = next((t for t in db.vocational if t["tradeCode"] == trade_code), None)
    if not trade:
        # Fallback to trade 452 for sample-id or unknown code
        trade = db.vocational[0]

    return {
        "tradeCode": trade["tradeCode"],
        "tradeName": trade["name"],
        "nameTamil": trade.get("nameTamil"),
        "enrolledStudents": trade.get("enrolledStudents", 35),
        "modules": trade.get("modules", []),
        "practicalRubrics": trade.get("practicalRubrics", [])
    }

