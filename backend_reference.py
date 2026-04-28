from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from enum import Enum
from datetime import datetime
import uuid

app = FastAPI(title="UniFound Backend API", description="Python backend for Lost and Found portal")

class UserRole(str, Enum):
    STUDENT = "STUDENT"
    STAFF = "STAFF"
    ADMIN = "ADMIN"

class ItemStatus(str, Enum):
    LOST = "LOST"
    FOUND = "FOUND"
    CLAIMED = "CLAIMED"
    RESOLVED = "RESOLVED"

class Category(str, Enum):
    ELECTRONICS = "Electronics"
    CLOTHING = "Clothing"
    ID_CARDS = "ID Cards"
    BOOKS = "Books"
    KEYS = "Keys"
    OTHER = "Other"

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    is_verified: bool
    avatar: Optional[str] = None

class ItemReportBase(BaseModel):
    type: str # "LOST" or "FOUND"
    title: str
    description: str
    category: Category
    location: str
    date_occurred: datetime

class ItemReportCreate(ItemReportBase):
    pass

class ItemReportResponse(ItemReportBase):
    id: str
    user_id: str
    date_reported: datetime
    status: ItemStatus
    image_url: Optional[str] = None

# Database
users_db = {}
items_db = {}

@app.post("/auth/register", response_model=UserResponse)
def register_user(user: UserCreate):
    for u in users_db.values():
        if u["email"] == user.email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    new_user = {
        "id": user_id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_verified": False, # Requires email verification
        "avatar": f"https://ui-avatars.com/api/?name={user.name.replace(' ', '+')}",
        "password": user.password # In reality, hash this
    }
    users_db[user_id] = new_user
    
    # Trigger email verification logic here
    print(f"Sending verification email to {user.email}")
    
    return new_user

@app.get("/auth/verify/{token}")
def verify_email(token: str):
    # In a real app, decode token and find user
    # For mock purposes, we'll just verify the first unverified user
    for user_id, user in users_db.items():
        if not user["is_verified"]:
            users_db[user_id]["is_verified"] = True
            return {"message": "Email verified successfully"}
    raise HTTPException(status_code=400, detail="Invalid or expired token")

@app.post("/auth/login")
def login(email: str, role: UserRole):
    for user in users_db.values():
        if user["email"] == email and user["role"] == role:
            if not user["is_verified"]:
                raise HTTPException(status_code=403, detail="Please verify your email first")
            return {"token": "mock-jwt-token", "user": user}
    raise HTTPException(status_code=401, detail="Invalid credentials or role")

@app.get("/items", response_model=List[ItemReportResponse])
def get_items():
    return list(items_db.values())

@app.post("/items", response_model=ItemReportResponse)
def create_item(item: ItemReportCreate, user_id: str):
    if user_id not in users_db:
        raise HTTPException(status_code=404, detail="User not found")
        
    item_id = str(uuid.uuid4())
    new_item = {
        "id": item_id,
        "user_id": user_id,
        "date_reported": datetime.now(),
        "status": ItemStatus.LOST if item.type == "LOST" else ItemStatus.FOUND,
        **item.dict()
    }
    items_db[item_id] = new_item
    return new_item

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
