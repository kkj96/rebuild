# Rebuild

A low-code CRUD application builder powered by YAML configuration.

## Features

- **YAML-based Configuration** - Define pages, resources, and routes in YAML with Git version control
- **File-based Routing** - Organize routes in the `src/routes/` directory
- **Dynamic Page Rendering** - Build pages declaratively without writing code
- **Flexible Config Loading** - Support for embedded, local, and remote configuration sources
- **Type-safe** - Full TypeScript support

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── routes/                 # YAML-based route definitions
│   ├── _routes.yaml       # Route configuration
│   ├── _resources.yaml    # Resource definitions
│   ├── _app.yaml          # App settings (title, logo, etc.)
│   ├── dashboard/
│   │   └── page.yaml
│   ├── users/
│   │   ├── list.yaml
│   │   ├── create.yaml
│   │   ├── edit.yaml
│   │   └── show.yaml
│   └── ...
├── components/
│   ├── ui/                # UI components
│   ├── layout/            # Layout components
│   └── dynamic/           # Dynamic page renderer
├── lib/                   # Utilities
├── pages/                 # Code-based pages (builder, login)
└── providers/             # Data providers
```

## Configuration Examples

### Page Definition (`src/routes/users/list.yaml`)

```yaml
id: users-list
name: UserList
title: User Management
description: View and manage users

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

### Resource Definition (`src/routes/_resources.yaml`)

```yaml
resources:
  - name: users
    label: User Management
    endpoint: /users
    fields:
      - name: name
        label: Name
        type: text
        required: true
```

### App Settings (`src/routes/_app.yaml`)

```yaml
app:
  name: Rebuild
  title: Rebuild Admin
  logo:
    src: /logo.svg
  theme:
    primaryColor: "#0066FF"
```

## Configuration Modes

Rebuild supports three configuration modes:

| Mode | Description | Use Case |
|------|-------------|----------|
| `embedded` | Bundled at build time from `src/routes/` | Default, single-tenant apps |
| `local` | Fetched at runtime from `public/config/` | Development, testing |
| `remote` | Fetched from API server | Multi-tenant, SaaS platforms |

Set the mode via environment variables:

```bash
VITE_CONFIG_MODE=local
VITE_CONFIG_PATH=/config
```

## License

[MIT](LICENSE)
