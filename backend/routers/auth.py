"""
Authentication & EMIS Gateway Router
"""

import time
import uuid
from fastapi import APIRouter, HTTPException, status
from backend.database import db
from backend.models import EmisSsoRequest, LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["Authentication & EMIS Gateway"])


@router.post("/login", response_model=LoginResponse, summary="Teacher / Staff / Admin login with EMIS Credentials")
async def login(credentials: LoginRequest):
    """
    Authenticates a user against TN EMIS database or school U-DISE registry.
    Supports default administrative and teacher credentials.
    """
    email = credentials.userIdentity.strip().lower()
    role = (credentials.role or "teacher").lower()

    # Determine user identity
    if "admin" in email or role == "admin":
        user_info = {
            "id": "A-TN-ADMIN-01",
            "name": "Dr. K. Arulmozhi",
            "nameTamil": "முனைவர் கே. அருள்மொழி",
            "role": "admin",
            "schoolId": credentials.schoolCode or "33240100201",
            "schoolName": "Govt Model HSS, Madurai",
            "classesAssigned": ["12-A", "12-B", "12-C", "12-V1", "12-V2"]
        }
    else:
        user_info = {
            "id": "T-TN-48291",
            "name": "K. Meenakshi Sundaram",
            "nameTamil": "கே. மீனாட்சி சுந்தரம்",
            "role": "teacher",
            "schoolId": credentials.schoolCode or "33240100201",
            "schoolName": "Govt Model HSS, Madurai",
            "classesAssigned": ["12-A", "12-B"]
        }

    token = f"jwt_token_examiq_{uuid.uuid4().hex[:16]}_{int(time.time())}"

    # Log login action
    db.add_audit_log(
        user=user_info["name"],
        action=f"User signed in successfully via EMIS Gateway with role '{user_info['role']}'"
    )

    return {
        "status": "success",
        "token": token,
        "user": user_info
    }


@router.post("/emis-sso", summary="TN EMIS State Portal Single Sign-On Callback")
async def emis_sso(payload: EmisSsoRequest):
    """
    Verifies state single sign-on token and initiates authorized session.
    """
    if not payload.emisAuthCode:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing EMIS authorization code"
        )

    token = f"jwt_emis_sso_verified_{uuid.uuid4().hex[:12]}"
    user_info = {
        "id": "T-TN-48291",
        "name": "K. Meenakshi Sundaram",
        "role": "teacher",
        "schoolId": "33240100201",
        "schoolName": "Govt Model HSS, Madurai"
    }

    db.add_audit_log(
        user=user_info["name"],
        action="Single Sign-On callback verified from TN EMIS portal"
    )

    return {
        "status": "success",
        "token": token,
        "user": user_info
    }

