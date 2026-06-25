import csv
import io
import asyncio

from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from core.database import get_db
from core.config import settings
from core.security import verify_password, create_access_token

from models.user import User, RoleEnum

from schemas.user import UserResponse
from schemas.user import ChangePasswordRequest

from services.user_service import get_user_by_username, get_password_hash, bulk_create_users
from api.dependencies import get_current_user, RoleChecker


router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(response: Response, login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await get_user_by_username(db, login_data.username)
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    
    access_token_expires = timedelta(minutes=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=access_token_expires
    )
    
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        secure=False, # TODO: change to true in prod
        samesite="lax",
        max_age=int(settings.ACCESS_TOKEN_EXPIRE_MINUTES) * 60
    )
    return {"message": "Login successful"}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token")
    return {"message": "Logout successful"}

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect old password"
            )
    
    if verify_password(data.new_password, current_user.hashed_password):
        raise HTTPException(
        status_code=400,
        detail="New password must be different from current password"
        )
    
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.force_password_change = False

    db.add(current_user)
    await db.commit()

    return {"message": "Password changed successfully"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


require_superadmin = RoleChecker([RoleEnum.SUPERADMIN])

def process_csv_data(rows_list):
    users_to_insert = []
    for row in rows_list:
        npm = row.get("npm", "").strip()
        email = row.get("email", "").strip()
        
        if not npm or not email:
            continue
            
        default_password = f"Praktis{npm}"
        hashed_password = get_password_hash(default_password)
        
        users_to_insert.append({
            "username": npm,
            "email": email,
            "role": RoleEnum.PRAKTIKAN,
            "hashed_password": hashed_password,
            "force_password_change": True,
            "is_active": True
        })
    return users_to_insert


@router.post("/import-csv")
async def import_students_csv(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(require_superadmin)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a .csv file.")
    
    content = await file.read()
    try:
        decoded_content = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(decoded_content))
        rows_list = list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if not rows_list:
        raise HTTPException(status_code=400, detail="CSV is empty.")

    users_to_insert = await asyncio.to_thread(process_csv_data, rows_list)
    
    if not users_to_insert:
        raise HTTPException(status_code=400, detail="Missing required 'npm' or 'email' values in rows.")

    try:
        inserted_count = await bulk_create_users(db, users_to_insert)
    except Exception as db_err:
        raise HTTPException(status_code=400, detail=f"Database insertion failed: {str(db_err)}")
    
    return {
        "message": "Import successful",
        "total_processed": len(users_to_insert),
        "total_inserted": inserted_count,
        "skipped_duplicates": len(users_to_insert) - inserted_count
    }