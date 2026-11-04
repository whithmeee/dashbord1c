# Technology Profile

tech-profile:
  backend: php-laravel
  frontend: react-ts
  css: tailwind
  browser-testing: not-configured

## Backend

| Concern | Technology |
|---------|-----------|
| Language | PHP 8.3+ |
| Framework | Laravel 13 |
| Build tool | Composer |
| Authentication | Laravel Sanctum SPA sessions |
| Web | Laravel routing and controllers |
| Persistence | Eloquent ORM |
| Database | SQLite (dev), configurable in production |
| Migrations | Laravel migrations |

## Frontend

| Concern | Technology |
|---------|-----------|
| Language | TypeScript |
| Framework | React 18 |
| Build tool | Vite |
| Test runner | Vitest |
| HTTP testing | Native fetch test doubles |

## CSS

| Concern | Technology |
|---------|-----------|
| Framework | Tailwind CSS |
| Icons | lucide-react |

## Browser Testing

| Concern | Technology |
|---------|-----------|
| Framework | Not configured |

## Testing

| Concern | Technology |
|---------|-----------|
| Backend | PHPUnit 12 |
| Frontend | Vitest 4, Node environment |

## Infrastructure

| Concern | Technology |
|---------|-----------|
| Containerization | Docker / docker-compose |
| Local addresses | Dynamic ports from `infrastructure/.env` |

## Conventions

### Backend

| Concern | Convention |
|---------|-----------|
| Test disable marker | `->markTestSkipped()` |
| Run command | `infrastructure/scripts/run-backend.sh` |
| Test command | `php artisan test` |
| Configuration | Laravel environment variables |
| Docker config syntax | ${VAR:-fallback} |

### Frontend

| Concern | Convention |
|---------|-----------|
| Test skip marker | .skip |
| Dev command | npm run dev |
| Test command | `npm test` |
| API base URL | `VITE_API_BASE_URL`, empty for same-origin |
| Local API URL | Exported by `infrastructure/scripts/run-frontend.sh` |

### Browser Testing

| Concern | Convention |
|---------|-----------|
| Acceptance test command | Not configured |
