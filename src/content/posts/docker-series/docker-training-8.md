---
title: "Docker Training 8 - From Lean Images to Real Services"
pubDate: 2025-08-10T21:35:42.394Z
tags: [docker-series, docker, docker-compose]
categories: [tutorial, docker]
series: docker-training
heroImage: /og/blog/docker-training-8.png
card: /og/blog/docker-training-8.png
description: "A small Go CRUD API and a Postgres database in two containers, wired together with Docker Compose, with a multi-stage build and configuration by environment variables."
---


Last time we trimmed our image from chunky to chonky-less. Love that for us.  
Now lets put that discipline to work and build something you can actually use: a **CRUD API** backed by **Postgres**. Two containers, clean networking, multi-stage builds, small artifacts. No fluff.

What you will get:

- A tiny Go API that exposes `/users` with **Create, Read, Update, Delete**
- A Postgres database running in its own container
- A `docker-compose.yml` that wires everything together
- A multi-stage Dockerfile that ships a slim production image
- Tips, gotchas, and next steps

Pipe dreams? Nah. Lets do it.

---

## The plan (and why)

- **Separate containers** for API and DB mirrors production reality. Swappable pieces, clearer boundaries.
- **Environment variables** for configuration so we do not bake secrets into images.
- **Multi-stage build** to keep the API image tight (carry forward the work from Training 7).
- **Init SQL** so local dev stands up cleanly, every time.

---

## Project layout

```
docker-training-8/
├─ api/
│  ├─ main.go
│  ├─ go.mod
│  └─ Dockerfile
├─ db/
│  └─ init/01_create_users.sql
└─ docker-compose.yml
```

Create these files as we go.

---

## API: minimal Go users service

We will use `net/http` + `github.com/gorilla/mux` and `github.com/lib/pq`.  
**Note:** We will auto-create the table if it does not exist (helpful on first boot).

**`api/main.go`**

```go
package main
import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"
        "github.com/gorilla/mux"
         _ "github.com/lib/pq"
)
type User struct {
 ID    int    `json:"id"`
 Name  string `json:"name"`
 Email string `json:"email"`
}
func dbConn() (*sql.DB, error) {
 host := envOr("DB_HOST", "localhost")
 port := envOr("DB_PORT", "5432")
 user := envOr("DB_USER", "user")
 pass := envOr("DB_PASSWORD", "password")
 name := envOr("DB_NAME", "appdb")
 ssl  := envOr("DB_SSLMODE", "disable")
 connStr := fmt.Sprintf(
  "host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
  host, port, user, pass, name, ssl,
 )
 return sql.Open("postgres", connStr)
}
func envOr(key, def string) string {
 if v := os.Getenv(key); v != "" {
  return v
 }
 return def
}
func ensureSchema(ctx context.Context, db *sql.DB) error {
 ddl := `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL
);`
 _, err := db.ExecContext(ctx, ddl)
 return err
}
func withRetries(ctx context.Context, fn func() error, attempts int, backoff time.Duration) error {
 var err error
 for i := 0; i < attempts; i++ {
  if err = fn(); err == nil {
   return nil
  }
  log.Printf("retry %d/%d after error: %v", i+1, attempts, err)
  select {
  case <-time.After(backoff):
   backoff *= 2
  case <-ctx.Done():
   return ctx.Err()
  }
 }
 return err
}
func main() {
 ctx := context.Background()
 db, err := dbConn()
 if err != nil {
  log.Fatalf("db open: %v", err)
 }
 defer db.Close()
 // Wait for DB to be ready (compose does not guarantee readiness).
 err = withRetries(ctx, func() error {
  return db.PingContext(ctx)
 }, 6, 500*time.Millisecond)
 if err != nil {
  log.Fatalf("db ping: %v", err)
 }
 if err := ensureSchema(ctx, db); err != nil {
  log.Fatalf("ensure schema: %v", err)
 }
 r := mux.NewRouter()
 // POST /users
 r.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
  var u User
  if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
   http.Error(w, err.Error(), http.StatusBadRequest)
   return
  }
  if u.Name == "" || u.Email == "" {
   http.Error(w, "name and email are required", http.StatusBadRequest)
   return
  }
  err := db.QueryRowContext(r.Context(),
   "INSERT INTO users(name, email) VALUES($1, $2) RETURNING id",
   u.Name, u.Email,
  ).Scan(&u.ID)
  if err != nil {
   http.Error(w, err.Error(), http.StatusInternalServerError)
   return
  }
  writeJSON(w, http.StatusCreated, u)
 }).Methods(http.MethodPost)
 // GET /users
 r.HandleFunc("/users", func(w http.ResponseWriter, r *http.Request) {
  rows, err := db.QueryContext(r.Context(), "SELECT id, name, email FROM users ORDER BY id")
  if err != nil {
   http.Error(w, err.Error(), http.StatusInternalServerError)
   return
  }
  defer rows.Close()
  var users []User
  for rows.Next() {
   var u User
   if err := rows.Scan(&u.ID, &u.Name, &u.Email); err != nil {
    http.Error(w, err.Error(), http.StatusInternalServerError)
    return
   }
   users = append(users, u)
  }
  writeJSON(w, http.StatusOK, users)
 }).Methods(http.MethodGet)
 // PUT /users/{id}
 r.HandleFunc("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
  idStr := mux.Vars(r)["id"]
  id, err := strconv.Atoi(idStr)
  if err != nil {
   http.Error(w, "invalid id", http.StatusBadRequest)
   return
  }
  var u User
  if err := json.NewDecoder(r.Body).Decode(&u); err != nil {
   http.Error(w, err.Error(), http.StatusBadRequest)
   return
  }
  res, err := db.ExecContext(r.Context(),
   "UPDATE users SET name=$1, email=$2 WHERE id=$3",
   u.Name, u.Email, id,
  )
  if err != nil {
   http.Error(w, err.Error(), http.StatusInternalServerError)
   return
  }
  n, _ := res.RowsAffected()
  if n == 0 {
   http.Error(w, "not found", http.StatusNotFound)
   return
  }
  u.ID = id
  writeJSON(w, http.StatusOK, u)
 }).Methods(http.MethodPut)
 // DELETE /users/{id}
 r.HandleFunc("/users/{id}", func(w http.ResponseWriter, r *http.Request) {
  idStr := mux.Vars(r)["id"]
  res, err := db.ExecContext(r.Context(), "DELETE FROM users WHERE id=$1", idStr)
  if err != nil {
   http.Error(w, err.Error(), http.StatusInternalServerError)
   return
  }
  n, _ := res.RowsAffected()
  if n == 0 {
   http.Error(w, "not found", http.StatusNotFound)
   return
  }
  w.WriteHeader(http.StatusNoContent)
 }).Methods(http.MethodDelete)
 // Health
 r.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
  if err := db.Ping(); err != nil {
   http.Error(w, "unhealthy", http.StatusServiceUnavailable)
   return
  }
  w.WriteHeader(http.StatusOK)
 })
 addr := ":8080"
 log.Printf("API listening on %s", addr)
 if err := http.ListenAndServe(addr, r); !errors.Is(err, http.ErrServerClosed) && err != nil {
  log.Fatalf("server: %v", err)
 }
}
func writeJSON(w http.ResponseWriter, status int, v any) {
 w.Header().Set("Content-Type", "application/json")
 w.WriteHeader(status)
 _ = json.NewEncoder(w).Encode(v)
}
```

Run `go mod tidy` locally if you are hacking outside the container.

## Multi-stage Dockerfile (carryover discipline)

We stay consistent with Training 7: compile in a builder, copy just the artifact into a tiny runtime.

**`api/Dockerfile`**

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder
ENV CGO_ENABLED=0 GO111MODULE=on
RUN apk add --no-cache git
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN --mount=type=cache,target=/root/.cache/go-build \
    go build -o /out/api ./main.go

# Run stage
FROM alpine:3.20
RUN apk add --no-cache ca-certificates
WORKDIR /
COPY --from=builder /out/api /api
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=2s --retries=3 CMD wget -qO- http://localhost:8080/healthz || exit 1
ENTRYPOINT ["/api"]
```

> *Tip:* `CGO_ENABLED=0` *gives you a fully static binary so the final image can be super minimal.*

## Postgres with init SQL

Use the official image and seed schema via the built-in init hook. **`db/init/01_create_users.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name  TEXT NOT NULL,
  email TEXT NOT NULL
);
```

## Compose it together

Two services, one volume, a tiny userland API. The `depends_on` helps with order, and a healthcheck makes local DX nicer. **`docker-compose.yml`**

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: appdb
    volumes:
      - db_data:/var/lib/postgresql/data
      - ./db/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 10
    ports:
      - "5432:5432"

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    environment:
      DB_HOST: db
      DB_PORT: "5432"
      DB_USER: user
      DB_PASSWORD: password
      DB_NAME: appdb
      DB_SSLMODE: disable
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8080:8080"

volumes:
  db_data:
```

## Run it

```bash
# from project root
docker compose up --build
```

You should see logs for Postgres initializing and the API starting on :8080.

## Try the endpoints

Create a user:

```bash
curl -sS -X POST http://localhost:8080/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com"}' | jq
```

Get all users:

```bash
curl -sS http://localhost:8080/users | jq
```

Update a user (id 1):

```bash
curl -sS -X PUT http://localhost:8080/users/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Updated","email":"alice@new.example"}' | jq
```

Delete a user:

```bash
curl -i -X DELETE http://localhost:8080/users/1
```

Health:

```bash
curl -i http://localhost:8080/healthz
```

Yay we did it.

## Troubleshooting (aka stuff that bit me)

### *DB starts after API*

> *Compose’s* `depends_on` *is not readiness. We added a DB healthcheck and an app-level retry. If you still race, increase retries/backoff in* `withRetries`

### *Port collisions*

> *If* `5432` *or* `8080` *are busy, change the left-hand side of the port mapping in compose (e.g.,* `8081:8080`*).*

### *Schema drift*

> *For real projects, use migrations (e.g., golang-migrate) instead of ad-hoc DDL. Init SQL is fine for demos.*

### *Image size creep*

> *Keep using multi-stage builds. If you add native deps, you may need* `CGO_ENABLED=1` *and a slightly heavier runtime (alpine is a sweet spot).*

## Why this pattern matters

- Swappability: API does not care if the DB is local, remote, or swapped to MySQL later.
- Repeatability: docker compose up — build gets anyone on your team a working stack.
- Small artifacts: Faster CI/CD pushes and pulls, less “fat” shipped to prod.

## Next steps

- Add migrations and seed data
- Add auth (even a simple API key) and request logging
- Wire in OpenAPI and generate clients
- Put this behind Kubernetes or Nomad, with readiness/liveness probes
- Add tests and a Makefile to script common tasks

## References

- Docker Compose: <https://docs.docker.com/compose/>
- Postgres Image: <https://hub.docker.com/_/postgres>
- Gorilla Mux: <https://github.com/gorilla/mux>
- lib/pq Driver: <https://github.com/lib/pq>

From tiny hello to working CRUD, with images still on a diet. Go test it out and enjoy.

**Next up:** In Docker Training 9, we’re taking our shiny new CRUD stack out for a bigger spin. We’ll migrate from Docker Compose to Kubernetes — same app, same lean images, but orchestrated like the big leagues. Get ready for manifests, services, and maybe even a touch of Helm.
