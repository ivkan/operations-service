# Operations Service

A TypeScript-based service for handling WebSocket operations with logical replication support.

## Features

- Real-time WebSocket operations handling
- PostgreSQL logical replication monitoring
- Queue-based operation processing
- Metrics collection and monitoring
- Error handling and logging

## Prerequisites

- Node.js (v16+)
- PostgreSQL (v12+) with logical replication enabled
- TypeScript 5.3+

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
WS_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=operations_db
DB_USER=postgres
DB_PASSWORD=your_password
```

## Database Setup

Run migrations:

```bash
npm run migrate
```

## Usage

Start the service:

```bash
npm start
```

Run tests:

```bash
npm test
```

## Project Structure

```
operations-service/
├── src/
│   ├── config/         # Configuration files
│   ├── core/           # Core types and errors
│   ├── services/       # Business logic services
│   └── infrastructure/ # Database and queue implementations
├── migrations/         # Database migrations
└── tests/             # Test files
```

## License

MIT
```

This README provides essential information for developers to understand, set up, and run the project. You can expand it based on specific needs or additional features.
