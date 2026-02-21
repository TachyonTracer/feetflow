# Agent Architecture & Coding Standards (Senior Architect Approved) 🏗️

This document outlines the architectural principles and coding patterns that all AI agents (and developers) MUST follow when contributing to this project.

Our goal is a highly readable, maintainable, and scalable codebase that is easy for anyone—from a Senior Architect to a Junior Intern—to understand.

## 1. Core Principles

- **SOLID**: Each class/function has one responsibility. Segregate interfaces. Depend on abstractions.
- **KISS (Keep It Simple, Stupid)**: Avoid over-engineering. Use the simplest solution that solves the problem. No complex abbreviations.
- **DRY (Don't Repeat Yourself)**: If logic is used twice, move it to a shared service or component.
- **LIFT Architecture**:
  - **L**ocate: Find files quickly.
  - **I**dentify: Know what a file does at a glance.
  - **F**lat: Keep structures as flat as possible.
  - **T**ry to be DRY.

## 2. Directory Structure (The Pillars)

Refactor to these 5 pillars in `src/app/`:

1.  **`core/`**: Infrastructure singletons.
    - `config/`: App-wide configuration/API maps.
    - `models/`: Interface DTOs (e.g., `user.model.ts`). _Use singular names for models._
    - `guards/` & `interceptors/`: Security and HTTP middleware.
2.  **`services/`**: The Data Access Layer.
    - `api/`: The base `ApiService` (RxJS wrappers).
    - `controllers/`: Domain-specific API services (e.g., `users-api.service.ts`). _Only for HTTP calls._
3.  **`layouts/`**: The Shells.
    - Only structural components generated via `ng generate component layouts/name`.
    - Provide the "frame" (Header/Sidebar) for features.
4.  **`features/`**: The Business Logic.
    - Self-contained pages/modules (e.g., `features/auth`, `features/users/user-list`).
5.  **`shared/`**: Reusable Toolkits.
    - Dumb UI components, pipes, and directives.

## 3. Communication Pattern (The RxJS Standard)

All API calls must use the **Modern RxJS `{ next, error }` object syntax**. Avoid passing multiple arguments to `.subscribe()`.

```typescript
// Modern Subscribe Pattern
this.usersApiService.getAllUsers().subscribe({
  next: (data) => this.users.set(data),
  error: (err) => this.errorMessage.set('Failed to load'),
  complete: () => this.isLoading.set(false),
});
```

- **Retries**: Use `retry({ count, delay })` instead of deprecated `retryWhen`.
- **Caching**: Utilize the `ApiService` caching mechanism for stable reference data.

## 4. State Management (Signals)

Use **Angular Signals** for local and global state management. They provide predictable, high-performance reactivity.

```typescript
public users = signal<User[]>([]);
public isLoading = signal<boolean>(false);

this.users.set(newData);
this.users.update(current => [...current, newItem]);
```

## 5. Naming Conventions

**BE DESCRIPTIVE. NO SHORT NAMES.**

- ❌ `UsersApi.getAll()`
- ✅ `UsersApiService.getAllUsers()`
- ❌ `const u = user`
- ✅ `const currentUser = user`
- ❌ `users.api.ts`
- ✅ `users-api.service.ts`

## 6. Development Workflow for Agents

1.  **Analyze**: Use `find_by_name` to understand the current structure.
2.  **Plan**: Draft an `implementation_plan.md` following these LIFT principles.
3.  **Restructure**: Use `mv` and `mkdir` to organize files correctly.
4.  **Descriptive Code**: Write code that an intern can read without comments.
5.  **Verify**: Always run `npm run build` to ensure no import regressions.
