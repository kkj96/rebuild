from fastapi import APIRouter, HTTPException, status
from src.models import LoginRequest, LoginResponse, User
from src.database import users_db

router = APIRouter(prefix="/auth", tags=["auth"])

# Simple token store (in production, use proper JWT)
tokens: dict[str, int] = {}


@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Authenticate user and return access token."""
    # Find user by email
    user = None
    for u in users_db.get_all():
        if u.email == request.email:
            user = u
            break

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # For demo, accept any password
    # In production, verify hashed password
    token = f"mock_token_{user.id}"
    tokens[token] = user.id

    return LoginResponse(
        access_token=token,
        user=user,
    )


@router.post("/logout")
async def logout():
    """Logout user."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=User)
async def get_current_user():
    """Get current authenticated user (mock: returns first admin user)."""
    for user in users_db.get_all():
        if user.role == "admin":
            return user
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )
