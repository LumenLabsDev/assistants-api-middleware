# Open Assistants API (Responses-backed)

[![CI](https://github.com/LumenLabsDev/open-assistants-api/actions/workflows/ci.yml/badge.svg)](https://github.com/LumenLabsDev/open-assistants-api/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D18-informational)
![Fastify](https://img.shields.io/badge/Fastify-%20-lightgrey)
![TypeScript](https://img.shields.io/badge/TypeScript-%20-blue)
![Redis](https://img.shields.io/badge/Redis-%20-red)
![Azure Cosmos DB](https://img.shields.io/badge/Azure%20Cosmos%20DB-supported-0078D4)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow)
![Docker](https://img.shields.io/badge/Docker-ready-success)

**Assistants-shaped API façade built on the OpenAI Responses API.** Keep your Assistants-style client calls and migrate your backend to **Responses** at your own pace.  
Stack: **Fastify + TypeScript**, **Redis or Azure Cosmos DB** persistence, **Zod** validation, **structured logging**, and clean architecture.

## Highlights

- **Assistants**: create / list / get / update  
- **Threads**: create • **Messages**: list / add  
- **Runs**: create / list / get — translates thread context into a single **Responses** call  
- **Clean architecture**: domain, application (services), infrastructure (repos/clients), interfaces (HTTP controllers)  
- **MVC-ish controllers** with Zod validation and presenters that shape responses like Assistants  
- **Structured logs** (ISO timestamp, level, component, version)

## Requirements

- Node **18+**
- `OPENAI_API_KEY` in environment or `.env`
- Choose a database provider:
  - Redis (**7+**): set `REDIS_URL`
  - Azure Cosmos DB: set `DATABASE_PROVIDER=cosmos`, `COSMOS_ENDPOINT`, `COSMOS_KEY`, `COSMOS_DATABASE_ID`

### Quick start
```bash
npm install
echo "OPENAI_API_KEY=sk-..." > .env
echo "REDIS_URL=redis://localhost:6379" >> .env
npm run dev  # http://localhost:3500
```

### Cosmos DB quick start
```bash
npm install
echo "OPENAI_API_KEY=sk-..." > .env
echo "DATABASE_PROVIDER=cosmos" >> .env
echo "COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/" >> .env
echo "COSMOS_KEY=your-cosmos-db-key" >> .env
echo "COSMOS_DATABASE_ID=assistants-api" >> .env
npm run dev  # http://localhost:3500
```
### Docker
Build locally:
```bash
docker build -t open-assistants-api:local .
docker run --rm -p 3500:3500 \
  -e OPENAI_API_KEY=sk-... \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  open-assistants-api:local
```

Run with Cosmos DB:
```bash
docker run --rm -p 3500:3500 \
  -e OPENAI_API_KEY=sk-... \
  -e DATABASE_PROVIDER=cosmos \
  -e COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/ \
  -e COSMOS_KEY=your-cosmos-db-key \
  -e COSMOS_DATABASE_ID=assistants-api \
  open-assistants-api:local
```

Images are published to GHCR on release:
- `ghcr.io/LumenLabsDev/open-assistants-api:latest`
- `ghcr.io/LumenLabsDev/open-assistants-api:<version>`

GitHub Releases also attach an `linux-amd64` image tar for offline use.


`.env`:
```bash
OPENAI_API_KEY=sk-...
PORT=3500
# Select database provider (default = redis)
DATABASE_PROVIDER=redis

# When using Redis
REDIS_URL=redis://localhost:6379

# When using Azure Cosmos DB
# DATABASE_PROVIDER=cosmos
# COSMOS_ENDPOINT=https://your-account.documents.azure.com:443/
# COSMOS_KEY=your-cosmos-db-key
# COSMOS_DATABASE_ID=assistants-api
```

### Health check
```bash
curl -s http://localhost:3500/health
# {"status":"ok"}
```

### API shape (Assistants-like)
- Assistants resources include `object: "assistant"`, `created_at`.
- Threads: `object: "thread"` with `created_at`.
- Messages returned as `object: "list"` of items shaped like Assistants messages (text content parts).
- Runs returned as `object: "thread.run"`.

### Example flow
1) Create assistant
```bash
curl -s -X POST http://localhost:3500/v1/assistants -H 'content-type: application/json' \
  -d '{"name":"Helper","instructions":"Answer briefly.","model":"gpt-4o-mini"}'
```

2) Create thread
```bash
curl -s -X POST http://localhost:3500/v1/threads
```

3) Add message
```bash
curl -s -X POST http://localhost:3500/v1/threads/<thread_id>/messages -H 'content-type: application/json' \
  -d '{"role":"user","content":"Hello!"}'
```

4) Run
```bash
curl -s -X POST http://localhost:3500/v1/threads/<thread_id>/runs -H 'content-type: application/json' \
  -d '{"assistant_id":"<assistant_id>"}'
```

5) List messages
```bash
curl -s http://localhost:3500/v1/threads/<thread_id>/messages
```

### Quick reference (HTTP)
- POST `/v1/assistants` — create assistant `{ name?, model?, instructions? }`
- GET `/v1/assistants` — list assistants
- GET `/v1/assistants/:assistant_id` — get assistant
- POST `/v1/assistants/:assistant_id` — update assistant
- POST `/v1/threads` — create thread
- GET `/v1/threads/:thread_id/messages` — list messages (list wrapper)
- POST `/v1/threads/:thread_id/messages` — add message `{ role, content }` (`role` in `user|assistant|system`)
- POST `/v1/threads/:thread_id/runs` — create run `{ assistant_id, temperature? }`
- GET `/v1/threads/:thread_id/runs` — list runs (list wrapper)
- GET `/v1/threads/:thread_id/runs/:run_id` — get run

### Project layout
```
src/
  domain/            # Entities and interfaces (ports)
  application/       # Use cases (services)
  infra/             # Redis/Cosmos repositories, OpenAI Responses client, ID generator
  interfaces/http/   # Controllers, presenters, DTOs, validation, error handling
  container.ts       # Simple DI wiring (switches infra via env)
  server.ts          # Fastify bootstrap
```

### Notes & next steps
- Persistence requires a DB provider (Redis or Cosmos). Configure env vars accordingly.
- Add streaming endpoints and tool-calls if needed.
- The included OpenAPI YAMLs serve as references; not used for runtime validation.

### Architecture

Component layering (Clean Architecture-inspired):

```mermaid
graph TD
  subgraph Interfaces_HTTP
    Ctr[Controllers]
    Val[Zod Schemas]
    Pres[Presenters]
  end

  subgraph Application_Use_Cases
    SvcA[AssistantsService]
    SvcT[ThreadsService]
    SvcR[RunsService]
  end

  subgraph Domain
    Types[Types]
    Ports[Ports]
    Errors[Errors]
    Models[Models]
  end

  subgraph Infrastructure_Layer
    Repos[(Redis Repos)]
    Resp[OpenAI Responses Client]
    IdGen[UUID Id Generator]
    Redis[(Redis)]
    OpenAI[(OpenAI Responses)]
  end

  Ctr -->|validate| Val
  Ctr -->|call| SvcA
  Ctr -->|call| SvcT
  Ctr -->|call| SvcR

  SvcA --> Ports
  SvcT --> Ports
  SvcR --> Ports
  SvcA --> Types
  SvcT --> Types
  SvcR --> Types

  Repos -->|implements| Ports
  Resp -->|implements| Ports
  IdGen --> Repos

  Repos -->|persist| Redis
  Resp -->|invoke| OpenAI

  Pres --> Ctr
```

Run flow (create run over a thread):

```mermaid
sequenceDiagram
  participant Client
  participant HTTP as HTTP_Controller
  participant Runs as RunsService
  participant Assist as AssistantsRepo_Redis
  participant Msg as MessagesRepo_Redis
  participant RunRepo as RunsRepo_Redis
  participant OA as OpenAI_Responses

  Client->>HTTP: POST /v1/threads/:id/runs { assistant_id }
  HTTP->>Runs: createRun(threadId, assistantId)
  Runs->>Assist: get(assistantId)
  Assist-->>Runs: assistant
  Runs->>RunRepo: create({ queued })
  Runs->>Msg: listByThread(threadId)
  Runs->>OA: createTextResponse(model, input)
  OA-->>Runs: text
  Runs->>Msg: add({ role: assistant, content: text })
  Msg-->>Runs: message{id}
  Runs->>RunRepo: update({ completed, responseMessageId })
  Runs-->>HTTP: run
  HTTP-->>Client: 201 { run }
```

### Architecture
- Clean Architecture layering:
  - Domain: core types, errors, ports (`src/domain`)
  - Application: use cases (`src/application`)
  - Interfaces: HTTP controllers/validation/presenters (`src/interfaces/http`)
  - Infrastructure: repos and external clients (`src/infra`)
- Dependency flow: outer layers depend inward; infra implements domain ports.

### CI/CD
- CI: `.github/workflows/ci.yml` — build and test on Node 18/20/22; matrix includes runs with and without Redis service. Tests that require Redis are skipped when `REDIS_URL` is not set.
- Release: `.github/workflows/release.yml` — on release from `main`, pushes multi-arch Docker images to GHCR and uploads an amd64 image tar to the release.

### Testing
```bash
npm test        # run once
npm run test:watch
```
Tests include:
- Services tests using Redis repos (set `REDIS_URL`) and a fake Responses client
- HTTP integration test booting Fastify via `buildApp()`

### License
MIT
