# rebuild-server

Mock API server for Rebuild application development, built with FastAPI.

## Quick Start

```bash
# Install dependencies
uv sync

# Run the server
uv run uvicorn src.main:app --reload --port 8000
```

The server will start at `http://localhost:8000`.

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Authentication
- `POST /auth/login` - Login with email/password
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

### Users
- `GET /users` - List users (with pagination)
- `GET /users/{id}` - Get user by ID
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Roles
- `GET /roles` - List roles (with pagination)
- `GET /roles/{id}` - Get role by ID
- `POST /roles` - Create role
- `PUT /roles/{id}` - Update role
- `DELETE /roles/{id}` - Delete role

## Mock Data

The server automatically seeds initial data on startup:

**Users:**
- admin@example.com (Admin User)
- john@example.com (John Doe)
- jane@example.com (Jane Smith)
- bob@example.com (Bob Wilson)
- alice@example.com (Alice Brown)

**Roles:**
- admin (full permissions)
- editor (read, write)
- viewer (read only)

## Development

```bash
# Add new dependency
uv add <package>

# Format code
uv run ruff format .

# Lint code
uv run ruff check .
```
