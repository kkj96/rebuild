from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from src.models import Role, RoleCreate, RoleUpdate
from src.database import roles_db

router = APIRouter(prefix="/roles", tags=["roles"])


@router.get("", response_model=list[Role])
async def list_roles(
    _start: int = Query(0, alias="_start"),
    _end: int = Query(10, alias="_end"),
    _sort: Optional[str] = Query(None, alias="_sort"),
    _order: Optional[str] = Query(None, alias="_order"),
    q: Optional[str] = None,
):
    """List all roles with pagination and filtering."""
    roles = roles_db.get_all()

    # Filter by search query
    if q:
        roles = [r for r in roles if q.lower() in r.name.lower()]

    # Sort
    if _sort:
        reverse = _order == "DESC" if _order else False
        roles = sorted(roles, key=lambda x: getattr(x, _sort, ""), reverse=reverse)

    # Get total before pagination
    total = len(roles)

    # Paginate
    roles = roles[_start:_end]

    return roles


@router.get("/{id}", response_model=Role)
async def get_role(id: int):
    """Get a role by ID."""
    role = roles_db.get(id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return role


@router.post("", response_model=Role, status_code=status.HTTP_201_CREATED)
async def create_role(role: RoleCreate):
    """Create a new role."""
    # Check if name already exists
    for existing in roles_db.get_all():
        if existing.name == role.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Role name already exists",
            )

    roles_db._counter += 1
    new_role = Role(
        id=roles_db._counter,
        name=role.name,
        description=role.description,
        permissions=role.permissions,
    )
    roles_db._data[roles_db._counter] = new_role
    return new_role


@router.put("/{id}", response_model=Role)
async def update_role(id: int, role_update: RoleUpdate):
    """Update a role."""
    role = roles_db.get(id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )

    updates = role_update.model_dump(exclude_unset=True)
    updated_role = roles_db.update(id, updates)
    return updated_role


@router.patch("/{id}", response_model=Role)
async def patch_role(id: int, role_update: RoleUpdate):
    """Partially update a role."""
    return await update_role(id, role_update)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(id: int):
    """Delete a role."""
    if not roles_db.delete(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found",
        )
    return None
