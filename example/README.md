# Rokke authenticated CRUD example

This private workspace is a runnable reference application for the stabilized Rokke alpha. It uses only public `@rokke/*` APIs and demonstrates automatic controller discovery, SQLite initialization, password hashing, JWT authentication, owner-isolated task CRUD, validation, health/readiness and graceful shutdown.

## Run

From the repository root:

```bash
bun install
bun run check:example
cd example
bun run start
```

The API listens on `http://127.0.0.1:3001` and stores local data in `example.sqlite`. Set `DATABASE_URL` to use another SQLite database and set `JWT_SECRET` to keep tokens valid across restarts. For reload-on-change development, run `bun run dev` inside `example/`.

## API

| Method | Route | Authentication | Purpose |
|---|---|---|---|
| `GET` | `/` | No | Framework greeting |
| `POST` | `/auth/register` | No | Create a user |
| `POST` | `/auth/login` | No | Obtain a bearer JWT |
| `GET` | `/auth/me` | Bearer JWT | Read the authenticated profile |
| `GET` | `/tasks` | Bearer JWT | List the user's tasks |
| `POST` | `/tasks` | Bearer JWT | Create a task |
| `GET` | `/tasks/:id` | Bearer JWT | Read an owned task |
| `PUT` | `/tasks/:id` | Bearer JWT | Replace an owned task |
| `DELETE` | `/tasks/:id` | Bearer JWT | Delete an owned task |
| `GET` | `/health` | No | Liveness |
| `GET` | `/ready` | No | Provider readiness |

Register and log in with `{ "username": "ada", "password": "password123" }`. Task writes use `{ "title": "Ship alpha", "description": "Run the gates", "completed": false }`. Send the login token as `Authorization: Bearer <token>`.

## Verify the whole flow

From the repository root:

```bash
bun run smoke:example
```

The smoke test uses a disposable SQLite database and exercises unauthorized access, registration, login, profile, create, list, read, update, delete, health and shutdown.

This example is for local alpha evaluation only and is not production-ready.
