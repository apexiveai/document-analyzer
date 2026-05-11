# Contributing Guidelines

Thank you for contributing to this project! Please follow the rules below to keep our codebase clean, consistent, and easy to maintain.

## Branch Naming

**Use the following format for branch names:**

- `feature/[description]` - For new features
- `fix/[description]` - For bug fixes
- `docs/[description]` - For documentation updates
- `refactor/[description]` - For code refactoring

**Examples:**

- `feature/add-authentication`
- `feature/user-management`
- `fix/billing`
- `docs/api-documentation`

## Git Commit Messages

**Use the following format for commit:**

- `feat:` → For new features
- `fix:` → For bug fixes
- `docs:` → For documentation changes
- `refactor:` → For code refactoring without changing functionality
- `test:` → For adding or updating tests

**Examples:**

- `feat: add user authentication system`
- `fix: resolve billing error`
- `docs: update API documentation`
- `refactor: optimize database queries`

## File Naming Convention

- Use **camelCase** for all files:
  **Examples:**
- `userController.ts`
- `userService.ts`

## Security Guidelines

- **Never commit sensitive data** (API keys, passwords, tokens)
- **Always hash passwords** using bcrypt before storing
- **Validate all inputs** using Zod schemas
- **Use HTTPS** in production environments
- **Implement rate limiting** for sensitive endpoints (login attempts)
- **Use role-based access control** with middleware (proxy in Nextjs >= 16)
- **Never expose sensitive fields** in API responses (passwords, refresh tokens)

## API Response Format

All API responses should follow this consistent format:

```typescript

```

## Common Mistakes to Avoid

- Don't expose sensitive data in API responses (passwords, refresh_token)
- Don't use `any` type in TypeScript - use lib's types or pre-defined types
- Don't skip input validation - always validate with Zod schemas
- Don't commit `.env` files - use `.env.example` instead
- Don't forget error handling in async functions - use try/catch with next()
- Don't forget to hash passwords before storing in database
- Don't use direct database field names in API responses - use consistent naming

## Pull Requests

- Keep PRs small and focused on a single feature or fix
- Link related issues in the PR description
- Request at least one reviewer before merging
- Ensure all tests pass before submitting
- Update documentation if needed
- Follow the PR template (if available)
