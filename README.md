
# x402 Example

A small TypeScript/Express example project demonstrating usage of the `@x402/*` libraries.

## Overview

This repository contains a minimal example server and two helper modules that illustrate basic flows using the `@x402` packages (core, evm, express, fetch). It's intended as a starting point for integration and experimentation.

## Requirements

- Node.js (v16+ recommended)
# x402 Example

A small TypeScript example demonstrating two transaction-flow patterns using the `@x402/*` libraries.

## Overview

This repository contains minimal example code showing two approaches for sending transactions and coordinating buyer/server flows:

- **Optimistic**: does NOT wait for the transaction to be mined/settled — the flow proceeds immediately after sending the transaction (non-blocking).
- **Settle**: waits for the transaction to be mined/confirmed before continuing — the flow blocks until the transaction is settled.

Both approaches are useful in different integration scenarios; this repo provides small example servers and buyer modules for each.

## Features

- `optimistic` flow: fast, non-blocking. The service does not wait for chain confirmation.
- `settle` flow: waits for the transaction to be confirmed before continuing, which provides stronger delivery guarantees.

## Files (examples)

- [src/optimistic/optimistic-buyer.ts](src/optimistic/optimistic-buyer.ts): buyer-side example using the optimistic (no-wait) flow.
- [src/optimistic/optimistic-server.ts](src/optimistic/optimistic-server.ts): server that demonstrates the optimistic handling.
- [src/settle/settle-buyer.ts](src/settle/settle-buyer.ts): buyer-side example that waits for transaction settlement.
- [src/settle/settle-server.ts](src/settle/settle-server.ts): server that demonstrates the settle (wait-for-confirmation) handling.
- [src/facilitator.ts](src/facilitator.ts): shared facilitator/orchestration helpers used by the examples.

## Requirements

- Node.js (v16+ recommended)
- npm

## Install

Install dependencies:

```bash
npm install
```

Create a `.env` file in the project root for runtime configuration (for example `PORT=3000`).

## Run

Run the optimistic example server:

```bash
node src/optimistic/optimistic-server.ts
```

Run the settle example server:

```bash
node src/settle/settle-server.ts
```

## Notes

- Use the `optimistic` example when low-latency user experience is preferred and you can tolerate eventual settlement.
- Use the `settle` example when you need to ensure a transaction is confirmed before proceeding.

## License

Add license or author information to `package.json` as appropriate.
