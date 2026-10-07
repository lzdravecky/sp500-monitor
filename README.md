# S&P 500 Monitor

A Node.js application for monitoring S&P 500 drawdowns using SPY market data, with SXR8 used as the EUR investment reference.

The project is being built incrementally as a practical DevOps project, covering application state, PostgreSQL, Docker, infrastructure as code, CI/CD, security scanning, AWS deployment, and monitoring.

## Features

- SPY intraday price monitoring
- Dynamic all-time high (ATH) tracking
- Drawdown calculation
- Configurable drawdown thresholds
- Threshold rearming after market recovery
- Xetra market-hours awareness
- SXR8 EUR ATH tracking
- PostgreSQL persistence
- Versioned database migrations
- Market history and event storage
- Docker Compose orchestration
- Automated tests

## Architecture

Current local architecture:

```text
Docker Compose

PostgreSQL
    │
    │ service_healthy
    ▼
Database Migration
    │
    │ service_completed_successfully
    ▼
S&P 500 Monitor
```

The monitor currently runs as a one-shot process: it retrieves market data, evaluates the monitoring rules, persists the resulting state and exits.

PostgreSQL data is persisted independently using a Docker named volume.

## Tech Stack

- Node.js
- PostgreSQL 17
- Docker
- Docker Compose
- node-pg-migrate
- Twelve Data API
- EODHD API
- Node.js Test Runner

## Run Locally

Requirements:

- Docker
- Docker Compose
- Twelve Data API key
- EODHD API token

Create a local environment file from the provided template:

```bash
cp .env.example .env
```

Provide your API credentials and choose a local database password in `.env`.

Then start the stack:

```bash
docker compose up --build
```

Docker Compose starts PostgreSQL, waits for the database to become healthy, applies pending migrations, and runs the monitor.

## Database

Application state is stored in PostgreSQL.

Main tables:

```text
monitor_state
threshold_state
market_history
events
```

Database schema changes are versioned using `node-pg-migrate`. Applied migrations are tracked in the `pgmigrations` table.

Current migrations:

```text
001_initial_schema
002_add_market_history_index
```

The `market_history` table uses a composite index on `symbol` and `recorded_at` to support historical market-data queries efficiently.

## Tests

Run the automated test suite with:

```bash
npm test
```

The test suite covers the core monitoring logic including drawdown calculations, threshold triggering and rearming, market-hours behavior, Xetra follow-up logic, and notification formatting.

## Project Structure

```text
sp500-monitor/
├── db/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_add_market_history_index.sql
├── scripts/
├── src/
│   ├── domain/
│   ├── notifications/
│   ├── services/
│   └── storage/
├── tests/
├── .dockerignore
├── .env.example
├── .gitignore
├── compose.yaml
├── Dockerfile
├── package.json
└── README.md
```

## Roadmap

The project is developed in incremental levels.

Current and planned areas include:

```text
Application & business logic
        ↓
PostgreSQL & Docker
        ↓
Terraform / Infrastructure as Code
        ↓
AWS deployment
        ↓
CI/CD & security scanning
        ↓
Monitoring & operations
```

The planned AWS runtime will use scheduled execution for automated market monitoring and notification delivery.

## Disclaimer

This project is intended for educational and monitoring purposes only and does not provide financial advice.