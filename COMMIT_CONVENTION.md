# Commit Message Convention

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

## Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect the meaning of the code (white-space, formatting, etc.) |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | A code change that improves performance |
| `test` | Adding missing tests or correcting existing tests |
| `build` | Changes that affect the build system or external dependencies |
| `ci` | Changes to CI configuration files and scripts |
| `chore` | Other changes that don't modify src or test files |
| `revert` | Reverts a previous commit |

## Scopes

| Scope | Description |
|-------|-------------|
| `ui` | Frontend (rebuild-ui) changes |
| `server` | Backend (rebuild-server) changes |
| `config` | Configuration (rebuild-config) changes |
| `deps` | Dependency updates |
| `*` | Multiple scopes or global changes (use sparingly) |

## Examples

### Feature
```
feat(ui): add page builder component palette
feat(server): implement user authentication API
feat(config): add YAML schema validation
```

### Bug Fix
```
fix(ui): resolve dark mode toggle not persisting
fix(server): correct pagination offset calculation
```

### Documentation
```
docs(ui): update README with setup instructions
docs: add commit convention guide
```

### Refactor
```
refactor(ui): extract common form components
refactor(server): reorganize router structure
```

### Style
```
style(ui): format code with prettier
style(server): apply ruff formatting
```

### Build/Dependencies
```
build(ui): upgrade vite to v5
build(server): add pydantic dependency
deps(ui): update lucide-react icons
```

### Chore
```
chore: update .gitignore
chore(ui): remove unused imports
```

## Guidelines

1. **Use imperative mood** in the description (e.g., "add" not "added" or "adds")
2. **Don't capitalize** the first letter of the description
3. **No period** at the end of the description
4. **Keep the first line under 72 characters**
5. **Use the body** to explain *what* and *why* vs. *how* (when needed)

## Breaking Changes

For breaking changes, add `!` after the type/scope or add `BREAKING CHANGE:` in the footer:

```
feat(server)!: change API response format

BREAKING CHANGE: API now returns paginated results by default
```

## Multi-line Commit Example

```
feat(ui): implement drag-and-drop for page builder

- Add react-dnd integration for component palette
- Support reordering components within containers
- Enable cross-container component moves

Closes #123
```
