# Apple Master

Apple Master is a community movie application for discovering films, sharing recommendations, and coordinating movie watching with friends and groups.

## Description

Apple Master combines a React and Vite frontend with an Express and Node.js backend and a PostgreSQL database. Users can search for movies through TMDB, view movie details, create and browse groups, maintain shared movie lists, and write ratings and reviews. The application can be started as a complete development environment with Docker Compose.

## Getting Started

### Dependencies

- Docker Desktop with Docker Compose
- Node.js 24.x and npm (for running the application without Docker)
- A TMDB API key
- Git

### Installing

Clone the repository and enter the project directory:

```bash
git clone https://github.com/HenriEkorre/apple_master.git
cd apple_master
```

Create a local environment file:

```bash
cp .env.example .env
```

Add your TMDB API key to `.env`:

```text
TMDB_API_KEY=your_tmdb_api_key
```

Do not commit `.env` or expose API keys and JWT secrets in source control.

### Executing program

#### Docker Compose

1. Start Docker Desktop.
2. Build and start the frontend, backend, and PostgreSQL services:

```bash
docker compose up --build
```

3. Open the application at [http://localhost:5173](http://localhost:5173).
4. Check the backend and database connection at [http://localhost:3000/api/health](http://localhost:3000/api/health).

To stop the services:

```bash
docker compose down
```

#### Local development

1. Install the dependencies:

```bash
npm ci
```

2. Start PostgreSQL and configure the database values in `.env`.
3. Start the backend in one terminal:

```bash
npm run dev:api
```

4. Start the frontend in another terminal:

```bash
npm run dev:web
```

The frontend is available at [http://localhost:5173](http://localhost:5173), and the backend runs on port `3000`.

## Help

If a service does not start, inspect its status and logs:

```bash
docker compose ps
docker compose logs backend
docker compose logs database
```

If port `5432` is already in use, stop the local PostgreSQL service or change `DB_EXPOSED_PORT` in `.env`. To reset the Docker database, including all stored data, run:

```bash
docker compose down -v
```

For development checks, run:

```bash
npm run test
npm run lint
```
