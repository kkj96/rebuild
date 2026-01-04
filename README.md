# Rebuild

A low-code CRUD application builder powered by YAML configuration, designed for GitOps workflows.

## Features

- **YAML-based Configuration** - Define pages, resources, and routes in YAML with Git version control
- **GitOps Ready** - Externalized configuration for CI/CD and infrastructure-as-code workflows
- **File-based Routing** - Organize routes in a directory structure
- **Dynamic Page Rendering** - Build pages declaratively without writing code
- **Flexible Config Loading** - Support for embedded, local, and remote configuration sources
- **Type-safe** - Full TypeScript support
- **i18n Ready** - Localization support with translation files

## Project Structure

```
rebuild/
├── rebuild-ui/          # Frontend application (React/TypeScript/Vite)
├── rebuild-server/      # Mock API server (FastAPI/Python)
├── rebuild-config/      # Configuration files (YAML, i18n) - GitOps managed
├── docs/                # Documentation (MDX)
└── README.md
```

## Architecture

Rebuild separates the application code (`rebuild-ui`) from configuration (`rebuild-config`) to enable GitOps workflows:

```
┌─────────────────────────────────────────────────────────────┐
│                    GitOps Pipeline                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ rebuild-ui   │    │rebuild-config│    │   Deploy     │  │
│  │ (App Code)   │ +  │ (YAML/i18n)  │ => │  Container   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Packages

### rebuild-ui

The main frontend application built with React, TypeScript, and Vite.

```bash
cd rebuild-ui
npm install
npm run dev
```

### rebuild-config

YAML configuration files and localization resources. This package is designed to be:
- Stored in a separate Git repository for GitOps workflows
- Mounted as a volume in containerized deployments
- Injected via CI/CD pipelines

```
rebuild-config/
├── app.yaml           # Application settings (name, logo, theme)
├── routes.yaml        # Route definitions
├── resources.yaml     # Resource/API definitions
├── pages/             # Page definitions (YAML)
│   ├── dashboard/
│   ├── users/
│   └── roles/
└── locales/           # Translation files
    ├── en.json        # English translations
    └── ko.json        # Korean translations
```

## Configuration Modes

Rebuild supports three configuration modes for different deployment scenarios:

| Mode | Description | Use Case |
|------|-------------|----------|
| `embedded` | Bundled at build time | Default, single-tenant apps |
| `local` | Fetched at runtime from `public/config/` | Development, testing, Docker volume mounts |
| `remote` | Fetched from API server | Multi-tenant, SaaS platforms |

### Environment Variables

```bash
# Set configuration mode
VITE_CONFIG_MODE=local|embedded|remote

# For remote mode, specify API endpoint
VITE_CONFIG_URL=https://api.example.com/config
```

## Quick Start

```bash
# Start the mock API server
cd rebuild-server
uv sync
uv run uvicorn src.main:app --reload --port 8000

# In another terminal, start the frontend
cd rebuild-ui
cp .env.example .env
npm install
npm run dev
```

API docs available at http://localhost:8000/docs

## GitOps Deployment

### Docker Compose Example

```yaml
version: '3.8'
services:
  rebuild-ui:
    image: rebuild-ui:latest
    environment:
      - VITE_CONFIG_MODE=local
    volumes:
      - ./rebuild-config:/app/public/config:ro
    ports:
      - "3000:80"
```

### Kubernetes Example

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: rebuild-config
data:
  app.yaml: |
    name: My Application
    logo: /logo.svg
  routes.yaml: |
    routes:
      - path: /
        type: yaml
        file: dashboard/page.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rebuild-ui
spec:
  template:
    spec:
      containers:
        - name: rebuild-ui
          image: rebuild-ui:latest
          env:
            - name: VITE_CONFIG_MODE
              value: "local"
          volumeMounts:
            - name: config
              mountPath: /app/public/config
      volumes:
        - name: config
          configMap:
            name: rebuild-config
```

## YAML Configuration Examples

### Page Definition

```yaml
id: users-list
name: UserList
title: User Management

components:
  - id: users-table
    type: table
    props:
      resource: users
      pageSize: 10
      columns:
        - field: name
          header: Name
        - field: email
          header: Email
```

### Resource Definition

```yaml
resources:
  - name: users
    label: Users
    endpoint: /users
    fields:
      - name: name
        label: Name
        type: text
        required: true
```

### Localization (i18n)

Translation files are stored in `rebuild-config/locales/` and loaded at runtime:

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "users": "Users",
    "settings": "Settings"
  },
  "actions": {
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete"
  }
}
```

Users can switch languages in Settings > Language.

## License

[MIT](LICENSE)
