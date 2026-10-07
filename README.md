# S&P 500 Monitor

A Node.js application that monitors the S&P 500 using SPY market data and tracks drawdowns from the all-time high (ATH).

The monitor is designed to detect significant market drawdowns and provide context for investing into the SXR8 ETF.

## Features

- SPY intraday price monitoring
- Dynamic SPY all-time high (ATH)
- Drawdown calculation
- Configurable drawdown thresholds
- Threshold rearming after market recovery
- Xetra market-hours awareness
- SXR8 EUR ATH tracking
- PostgreSQL persistence
- Database migrations
- Market history and event storage
- Docker and Docker Compose support
- Automated tests

## Architecture

Current local architecture:

```text
Docker Compose
     │
     ├── PostgreSQL
     │       │
     │    healthy
     │       ▼
     ├── Migration
     │       │
     │    completed successfully
     │       ▼
     └── S&P 500 Monitor
```

The services are started using dependency conditions:

```text
db
 │ service_healthy
 ▼
migrate
 │ service_completed_successfully
 ▼
app
```

The application is currently implemented as a one-shot process. It performs a monitoring run and exits successfully.

A later AWS deployment will schedule monitoring automatically.

## Requirements

For local development:

- Docker
- Docker Compose
- Twelve Data API key
- EODHD API token

Node.js is only required when running the application directly outside Docker.

## Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Then add your API credentials to `.env`:

```env
TWELVE_DATA_API_KEY=your_key
EODHD_API_TOKEN=your_token

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sp500_monitor
DB_USER=sp500
DB_PASSWORD=sp500_dev
```

`.env` contains secrets and is intentionally excluded from Git.

`.env.example` contains only configuration examples and can be committed safely.

## Run with Docker Compose

Start the complete stack:

```bash
docker compose up --build
```

Docker Compose will:

1. Pull the PostgreSQL image if necessary.
2. Build the application images.
3. Create the PostgreSQL volume and network.
4. Start PostgreSQL.
5. Wait until PostgreSQL is healthy.
6. Run all pending database migrations.
7. Start the S&P 500 Monitor.
8. Exit the application after the monitoring run completes.

PostgreSQL remains running so its data remains available for subsequent runs.

## Run the Monitor Again

To execute another one-shot monitoring run:

```bash
docker compose run --rm app
```

The existing PostgreSQL database and persisted state will be reused.

## Run Database Migrations

Run pending migrations manually:

```bash
docker compose run --rm migrate
```

Applied migrations are tracked by `node-pg-migrate` in the `pgmigrations` table.

Current migrations:

```text
001_initial_schema
002_add_market_history_index
```

## Stop the Stack

Stop and remove the Compose containers and network:

```bash
docker compose down
```

The PostgreSQL volume is preserved.

To also delete the database volume and all local database data:

```bash
docker compose down -v
```

Use `-v` only when a completely fresh database is desired.

## Database

PostgreSQL stores:

- monitor state and ATH
- threshold state
- market history
- generated events

Main tables:

```text
monitor_state
threshold_state
market_history
events
pgmigrations
```

Database data is stored in a Docker named volume and therefore has a lifecycle independent from the application containers.

## Tests

Run the automated tests:

```bash
npm test
```

Current test suite covers the main domain logic including:

- drawdown calculations
- threshold behavior
- threshold rearming
- market-hours logic
- Xetra follow-up logic
- notification formatting

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

## Planned Infrastructure

The project is being developed incrementally.

Planned next stages include:

```text
Terraform
   ↓
AWS infrastructure
   ↓
EventBridge
   ↓
Lambda
   ↓
Monitoring run
   ↓
SNS / email notifications
```

CI/CD and security scanning will be added using GitHub Actions and Trivy.

## Disclaimer

This project is intended for educational and monitoring purposes and does not provide financial advice.