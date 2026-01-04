from datetime import datetime
from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class MockDatabase(Generic[T]):
    """Simple in-memory database for mock data."""

    def __init__(self):
        self._data: dict[int, T] = {}
        self._counter: int = 0

    def create(self, item: T) -> T:
        self._counter += 1
        item_dict = item.model_dump()
        item_dict["id"] = self._counter
        item_dict["created_at"] = datetime.now()
        item_dict["updated_at"] = datetime.now()
        # Recreate with id
        new_item = item.__class__.model_validate({**item.model_dump(), "id": self._counter})
        self._data[self._counter] = new_item
        return new_item

    def get(self, id: int) -> T | None:
        return self._data.get(id)

    def get_all(self) -> list[T]:
        return list(self._data.values())

    def update(self, id: int, updates: dict) -> T | None:
        if id not in self._data:
            return None
        item = self._data[id]
        item_dict = item.model_dump()
        for key, value in updates.items():
            if value is not None:
                item_dict[key] = value
        item_dict["updated_at"] = datetime.now()
        updated_item = item.__class__.model_validate(item_dict)
        self._data[id] = updated_item
        return updated_item

    def delete(self, id: int) -> bool:
        if id in self._data:
            del self._data[id]
            return True
        return False

    def count(self) -> int:
        return len(self._data)

    def seed(self, items: list[T]) -> None:
        """Seed the database with initial data."""
        for item in items:
            self.create(item)


# Initialize databases
from src.models import User, Role, UserBase, RoleBase

users_db: MockDatabase = MockDatabase()
roles_db: MockDatabase = MockDatabase()


def seed_data():
    """Seed initial mock data."""
    # Seed roles
    if roles_db.count() == 0:
        initial_roles = [
            RoleBase(name="admin", description="Administrator with full access"),
            RoleBase(name="editor", description="Can edit content"),
            RoleBase(name="viewer", description="Read-only access"),
        ]
        for role in initial_roles:
            role_with_perms = Role(
                id=0,
                name=role.name,
                description=role.description,
                permissions=["read", "write", "delete"] if role.name == "admin" else ["read"],
            )
            roles_db._counter += 1
            role_with_perms = Role(
                id=roles_db._counter,
                name=role.name,
                description=role.description,
                permissions=["read", "write", "delete"] if role.name == "admin" else (["read", "write"] if role.name == "editor" else ["read"]),
            )
            roles_db._data[roles_db._counter] = role_with_perms

    # Seed users
    if users_db.count() == 0:
        initial_users = [
            UserBase(name="Admin User", email="admin@example.com", status="active", role="admin"),
            UserBase(name="John Doe", email="john@example.com", status="active", role="editor"),
            UserBase(name="Jane Smith", email="jane@example.com", status="active", role="viewer"),
            UserBase(name="Bob Wilson", email="bob@example.com", status="inactive", role="viewer"),
            UserBase(name="Alice Brown", email="alice@example.com", status="active", role="editor"),
        ]
        for user in initial_users:
            users_db._counter += 1
            user_obj = User(
                id=users_db._counter,
                name=user.name,
                email=user.email,
                status=user.status,
                role=user.role,
            )
            users_db._data[users_db._counter] = user_obj
