# rebuild-config

Configuration files for Rebuild applications. This package contains YAML-based page definitions, resource schemas, and localization files.

## Purpose

This package is designed for **GitOps workflows**, allowing you to:
- Version control your application configuration separately from code
- Deploy configuration changes without rebuilding the application
- Manage environment-specific configurations through Git branches
- Use CI/CD pipelines to validate and deploy configuration changes

## Structure

```
rebuild-config/
├── app.yaml           # Application settings (name, logo, theme)
├── routes.yaml        # Route definitions
├── resources.yaml     # Resource/API definitions
├── pages/             # Page definitions
│   ├── dashboard/
│   │   └── page.yaml
│   ├── users/
│   │   ├── list.yaml
│   │   ├── create.yaml
│   │   ├── edit.yaml
│   │   └── show.yaml
│   └── roles/
│       ├── list.yaml
│       ├── create.yaml
│       └── edit.yaml
└── locales/           # i18n translation files
    ├── en.json        # English
    └── ko.json        # Korean
```

## Configuration Files

### app.yaml
Application-level settings like name, logo, and default theme.

### routes.yaml
Route definitions mapping URL paths to pages. Supports:
- YAML-based pages (loaded from `pages/` directory)
- Code-based pages (built-in React components)

### resources.yaml
API resource definitions including:
- Endpoint URLs
- Field schemas
- Validation rules
- CRUD operation configurations

### pages/
YAML files defining UI components and layouts for each page.

### locales/
JSON translation files for internationalization. Each locale file contains:
- Navigation labels
- Action button text
- Form labels and validation messages
- Common UI strings

## Usage

### With rebuild-ui (embedded mode)

Bundle configuration at build time by copying files to `rebuild-ui/src/routes/`:

```bash
cp app.yaml ../rebuild-ui/src/routes/_app.yaml
cp routes.yaml ../rebuild-ui/src/routes/_routes.yaml
cp resources.yaml ../rebuild-ui/src/routes/_resources.yaml
cp -r pages/* ../rebuild-ui/src/routes/
cp -r locales ../rebuild-ui/public/config/
```

### With rebuild-ui (local mode)

Load configuration at runtime by copying files to `rebuild-ui/public/config/`:

```bash
cp app.yaml ../rebuild-ui/public/config/_app.yaml
cp routes.yaml ../rebuild-ui/public/config/_routes.yaml
cp resources.yaml ../rebuild-ui/public/config/_resources.yaml
cp -r pages ../rebuild-ui/public/config/
cp -r locales ../rebuild-ui/public/config/
```

### Docker Volume Mount

Mount this directory as a volume in Docker:

```yaml
services:
  rebuild-ui:
    image: rebuild-ui:latest
    volumes:
      - ./rebuild-config:/app/public/config:ro
```

### Kubernetes ConfigMap

Create a ConfigMap from this directory:

```bash
kubectl create configmap rebuild-config --from-file=.
```

## GitOps Workflow

### Recommended Branch Strategy

```
main           → Production configuration
├── staging    → Staging environment
└── develop    → Development environment
```

### CI/CD Pipeline Example

```yaml
# .github/workflows/deploy-config.yml
name: Deploy Configuration

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate YAML
        run: |
          npm install -g yaml-lint
          yaml-lint *.yaml pages/**/*.yaml

      - name: Deploy to environment
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            kubectl apply -k overlays/production
          else
            kubectl apply -k overlays/staging
          fi
```

## Localization

Translation files in `locales/` follow a nested JSON structure:

### Example: English (en.json)

```json
{
  "navigation": {
    "dashboard": "Dashboard",
    "users": "Users",
    "roles": "Roles",
    "settings": "Settings"
  },
  "actions": {
    "create": "Create",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel"
  },
  "table": {
    "noData": "No data available",
    "loading": "Loading..."
  }
}
```

### Example: Korean (ko.json)

```json
{
  "navigation": {
    "dashboard": "대시보드",
    "users": "사용자 관리",
    "roles": "권한 관리",
    "settings": "설정"
  },
  "actions": {
    "create": "생성",
    "edit": "수정",
    "delete": "삭제",
    "save": "저장",
    "cancel": "취소"
  }
}
```

### Adding a New Locale

1. Create a new JSON file: `locales/ja.json`
2. Copy the structure from `en.json`
3. Translate all values
4. The new locale will be available in Settings > Language

## License

[MIT](../LICENSE)
