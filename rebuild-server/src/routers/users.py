from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from src.models import User, UserCreate, UserUpdate
from src.database import users_db

router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[User])
async def list_users(
    _start: int = Query(0, alias="_start"),
    _end: int = Query(10, alias="_end"),
    _sort: Optional[str] = Query(None, alias="_sort"),
    _order: Optional[str] = Query(None, alias="_order"),
    q: Optional[str] = None,
):
    """List all users with pagination and filtering."""
    users = users_db.get_all()

    # Filter by search query
    if q:
        users = [u for u in users if q.lower() in u.name.lower() or q.lower() in u.email.lower()]

    # Sort
    if _sort:
        reverse = _order == "DESC" if _order else False
        users = sorted(users, key=lambda x: getattr(x, _sort, ""), reverse=reverse)

    # Get total before pagination
    total = len(users)

    # Paginate
    users = users[_start:_end]

    return users


@router.get("/{id}", response_model=User)
async def get_user(id: int):
    """Get a user by ID."""
    user = users_db.get(id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """Create a new user."""
    # Check if email already exists
    for existing in users_db.get_all():
        if existing.email == user.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    new_user = User(
        id=0,  # Will be set by database
        name=user.name,
        email=user.email,
        status=user.status,
        role=user.role,
    )
    users_db._counter += 1
    new_user = User(
        id=users_db._counter,
        name=user.name,
        email=user.email,
        status=user.status,
        role=user.role,
    )
    users_db._data[users_db._counter] = new_user
    return new_user


@router.put("/{id}", response_model=User)
async def update_user(id: int, user_update: UserUpdate):
    """Update a user."""
    user = users_db.get(id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    updates = user_update.model_dump(exclude_unset=True)
    updated_user = users_db.update(id, updates)
    return updated_user


@router.patch("/{id}", response_model=User)
async def patch_user(id: int, user_update: UserUpdate):
    """Partially update a user."""
    return await update_user(id, user_update)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(id: int):
    """Delete a user."""
    if not users_db.delete(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return None
