
# x402 Example

A small TypeScript/Express example project demonstrating usage of the `@x402/*` libraries.

## Overview

This repository contains a minimal example server and two helper modules that illustrate basic flows using the `@x402` packages (core, evm, express, fetch). It's intended as a starting point for integration and experimentation.

## Requirements

- Node.js (v16+ recommended)
- npm

## Install

Install dependencies:

```
npm install
```

This project uses `dotenv` for configuration. Create a `.env` file in the project root to provide environment variables (for example `PORT=3000`).

## Run

Quick run using `ts-node` (no build step):

```
npx ts-node src/server.ts
```

Or compile and run (if you add a `tsconfig.json`):

```
npm install --save-dev typescript
npx tsc
node dist/server.js
```

If you prefer, add scripts to `package.json` such as `start`, `build` and `dev`.

## Files

- `src/server.ts`: Entry point. Starts the Express server and wires up routes/middleware.
- `src/facilitator.ts`: Helper module that implements facilitator/orchestration logic used by the server.
- `src/buyer.ts`: Example client or handler logic representing a buyer flow used by the facilitator and server.

## Configuration

Place runtime configuration in a `.env` file. Common variables:

- `PORT` — port the Express server listens on (default: `3000`).
- Any API keys or endpoints required by the `@x402/*` libraries.

## Notes

- The project depends on `express`, `dotenv`, and several `@x402` scoped packages (see `package.json`).
- There are no tests defined; you can add test scripts to `package.json` as needed.

## License

This repository does not declare an author in `package.json`. Add a license or author information as appropriate.
