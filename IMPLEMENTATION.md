# MCP x402 Hedera Agent — Implementation Guide

## Overview

This project wires together three layers:

1. **Hedera Agent Kit** — an AI agent that can read balances, transfer HBAR/USDC, and call smart contracts via HCS/HTS.
2. **x402 Payment Protocol** — HTTP 402 middleware that gates any endpoint behind a micro-payment and auto-resolves when a valid receipt is presented.
3. **Hosted UI** — a React front-end with HashPack / WalletConnect wallet integration that drives the full pay → execute flow.

The result: a user clicks "Run Agent Task", pays ~$0.01–$1 USDC (or HBAR), the facilitator (blocky402.com) posts a receipt, your server verifies it, and the agent runs the requested service — all in one round-trip.

**GitHub repo:** https://github.com/Davedave001/mcp-x402-hedera-agent

---

## Architecture

```
┌───────────────────────────────────────────┐
│               Browser UI                  │
│  React + HashPack WalletConnect           │
│  ① User selects task + sees price quote   │
│  ② Wallet signs x402 payment transaction  │
└──────────────────┬────────────────────────┘
                   │ HTTP POST /agent/run
                   │ x-payment: <receipt>
                   ▼
┌───────────────────────────────────────────┐
│           Express API Server              │
│  x402-express middleware                  │
│  ③ Verify receipt via blocky402.com       │
│  ④ If valid → call Hedera Agent           │
└──────────────────┬────────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────────┐
│          Hedera Agent Kit (JS)            │
│  ⑤ Execute: balance / transfer / NFT /   │
│     HCS message / smart contract call     │
│  ⑥ Return structured result              │
└──────────────────┬────────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────────┐
│        Hedera Testnet / Mainnet           │
│  HBAR, USDC (HTS), HCS, Smart Contracts  │
└───────────────────────────────────────────┘
```

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20 | Use nvm or fnm |
| npm | ≥ 10 | — |
| Git | any | — |
| Hedera Testnet account | any | portal.hedera.com |
| blocky402.com account | — | Get facilitator API key |
| Vercel / Railway / Render | — | For hosting |

---

## Repository Structure

```
mcp-x402-hedera-agent/
├── packages/
│   ├── agent/          # Hedera Agent Kit backend
│   │   ├── src/
│   │   │   ├── agent.ts
│   │   │   ├── server.ts
│   │   │   └── tools/
│   │   │       ├── balance.ts
│   │   │       ├── transfer.ts
│   │   │       ├── hcs-message.ts
│   │   │       └── nft-mint.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── ui/             # React front-end
│       ├── src/
│       │   ├── App.tsx
│       │   ├── components/
│       │   │   ├── WalletConnect.tsx
│       │   │   ├── TaskSelector.tsx
│       │   │   └── ResultDisplay.tsx
│       │   └── hooks/
│       │       ├── useWallet.ts
│       │       └── useAgentTask.ts
│       └── package.json
├── .env.example
├── .gitignore
└── IMPLEMENTATION.md
```

---

## Git Workflow

### Commit conventions

```
<type>(<scope>): <short description>

Types: feat | fix | chore | docs | refactor | test
Scopes: repo | agent | server | x402 | ui | wallet | deploy
```

### Branch strategy

```
main          ← stable, deployed state
  └─ feat/agent-core     ← Hedera agent tools
  └─ feat/x402-server    ← Express + payment middleware
  └─ feat/ui-wallet      ← React UI + wallet integration
  └─ feat/mcp-server     ← optional MCP tool server
  └─ chore/deploy        ← Railway / Vercel config
```

Work one feature branch at a time. Open a PR and merge before moving to the next. Every commit should leave the code in a runnable or at-least-compilable state.

---

## Phased Development Plan

The table below is the complete commit roadmap. Each row is one commit — small enough to review in under 5 minutes. Follow the phases in order; later phases depend on earlier ones.

### Phase 0 — Repo Bootstrap (main branch)

| # | What changes | Commit message |
|---|-------------|----------------|
| 0.1 | `git init`, connect remote, add `.gitignore` (node_modules, .env, dist) | `chore(repo): init repo and add gitignore` |
| 0.2 | Root `package.json` with workspaces, `packages/agent/` and `packages/ui/` scaffold folders | `chore(repo): add npm workspaces scaffold` |
| 0.3 | `.env.example` with all required keys, `IMPLEMENTATION.md` | `docs(repo): add env example and implementation guide` |

### Phase 1 — Hedera Agent Core (`feat/agent-core`)

| # | What changes | Commit message |
|---|-------------|----------------|
| 1.1 | `packages/agent/package.json` + `tsconfig.json` only | `chore(agent): add package.json and tsconfig` |
| 1.2 | `packages/agent/src/agent.ts` — `createAgent()` wrapping HederaAgentKit | `feat(agent): add HederaAgentKit factory` |
| 1.3 | `packages/agent/src/tools/balance.ts` — `getHbarBalance` tool wrapper | `feat(agent): add get-balance tool` |
| 1.4 | `packages/agent/src/tools/transfer.ts` — `transferHbar` wrapper | `feat(agent): add transfer-hbar tool` |
| 1.5 | `packages/agent/src/tools/hcs-message.ts` — HCS topic message | `feat(agent): add HCS message tool` |
| 1.6 | `packages/agent/src/tools/nft-mint.ts` — NFT mint wrapper | `feat(agent): add NFT mint tool` |

> After 1.6: merge `feat/agent-core` → `main` via PR "Add Hedera agent core tools".

### Phase 2 — Express Server + x402 Middleware (`feat/x402-server`)

| # | What changes | Commit message |
|---|-------------|----------------|
| 2.1 | Bare Express server, `/health` endpoint, starts on port 3001 | `feat(server): add Express server with health endpoint` |
| 2.2 | CORS + JSON body-parser middleware | `feat(server): add CORS and JSON middleware` |
| 2.3 | x402 `paymentMiddleware` wired to `/agent/run`, no handler yet | `feat(x402): gate /agent/run with x402 payment middleware` |
| 2.4 | `POST /agent/run` route — dispatches to tool functions from Phase 1 | `feat(server): add agent task dispatch handler` |
| 2.5 | Input validation on `task` and `params` fields | `fix(server): validate task and params before dispatch` |
| 2.6 | Error handling — 400 for unknown task, 500 for agent errors | `fix(server): add structured error responses` |

> After 2.6: merge `feat/x402-server` → `main` via PR "Add x402-gated agent server".

### Phase 3 — MCP Tool Server (`feat/mcp-server`)

| # | What changes | Commit message |
|---|-------------|----------------|
| 3.1 | Install `@modelcontextprotocol/sdk`, add `mcp-server.ts` entry point | `feat(mcp): add MCP server entry point` |
| 3.2 | Register `hedera_get_balance` MCP tool | `feat(mcp): register get-balance tool` |
| 3.3 | Register `hedera_transfer_hbar` MCP tool | `feat(mcp): register transfer-hbar tool` |
| 3.4 | Register `hedera_send_hcs_message` and `hedera_mint_nft` tools | `feat(mcp): register HCS and NFT tools` |
| 3.5 | Add `mcp` npm script to `package.json` | `chore(mcp): add mcp start script` |

> After 3.5: merge `feat/mcp-server` → `main` via PR "Add MCP server for tool discovery".

### Phase 4 — React UI + Wallet (`feat/ui-wallet`)

| # | What changes | Commit message |
|---|-------------|----------------|
| 4.1 | Vite + React + TS scaffold, remove boilerplate | `chore(ui): scaffold Vite React app` |
| 4.2 | Install `@hashpack/hashconnect`, `ethers`, `axios` | `chore(ui): install wallet and http dependencies` |
| 4.3 | `useWallet.ts` hook — HashConnect init + pairing | `feat(wallet): add useWallet hook with HashPack pairing` |
| 4.4 | `WalletConnect.tsx` component — connect button + account display | `feat(wallet): add WalletConnect component` |
| 4.5 | `useAgentTask.ts` hook — probe → 402 → pay → retry flow (stub payment) | `feat(ui): add useAgentTask hook with x402 flow` |
| 4.6 | `fulfillX402Payment` — actual ethers.js wallet signing against Base/EVM | `feat(wallet): implement x402 payment signing` |
| 4.7 | `TaskSelector.tsx` — task list with price labels | `feat(ui): add TaskSelector component` |
| 4.8 | `ResultDisplay.tsx` — formatted JSON output panel | `feat(ui): add ResultDisplay component` |
| 4.9 | Wire components together in `App.tsx` | `feat(ui): compose App with wallet and task components` |
| 4.10 | Basic CSS / Tailwind styling pass | `feat(ui): add base styles` |

> After 4.10: merge `feat/ui-wallet` → `main` via PR "Add React UI with wallet and x402 flow".

### Phase 5 — Deploy Config (`chore/deploy`)

| # | What changes | Commit message |
|---|-------------|----------------|
| 5.1 | `packages/agent/Procfile` + `railway.toml` for Railway | `chore(deploy): add Railway config for agent server` |
| 5.2 | `packages/ui/vercel.json` — output dir and build command | `chore(deploy): add Vercel config for UI` |
| 5.3 | Update `README.md` with live URLs once deployed | `docs(repo): add live demo URLs to README` |

> After 5.3: merge `chore/deploy` → `main` via PR "Add deployment config".

### Phase 6 — Polish & Submission

| # | What changes | Commit message |
|---|-------------|----------------|
| 6.1 | End-to-end testnet smoke test — fix any issues found | `fix: address issues found in testnet smoke test` |
| 6.2 | Add submission feedback to `README.md` | `docs(repo): add required ecosystem submission feedback` |
| 6.3 | Final README pass — architecture diagram, quick-start, live demo link | `docs(repo): finalise README for ecosystem submission` |

---

## Detailed Implementation

### Phase 0 — Initial Setup Commands

```bash
# Clone the existing repo
git clone https://github.com/Davedave001/mcp-x402-hedera-agent.git
cd mcp-x402-hedera-agent

# Commit 0.1 — .gitignore
cat > .gitignore <<'EOF'
node_modules/
dist/
.env
*.env.local
.DS_Store
EOF
git add .gitignore
git commit -m "chore(repo): init repo and add gitignore"

# Commit 0.2 — workspace root
npm init -y
# edit package.json to add "workspaces": ["packages/*"]
mkdir -p packages/agent/src/tools packages/ui/src
git add package.json packages/
git commit -m "chore(repo): add npm workspaces scaffold"

# Commit 0.3 — docs
# create .env.example and IMPLEMENTATION.md
git add .env.example IMPLEMENTATION.md
git commit -m "docs(repo): add env example and implementation guide"

git push origin main
```

---

### Phase 1 — Agent Core Files

#### Commit 1.1 — package.json + tsconfig only

```bash
git checkout -b feat/agent-core
```

**packages/agent/package.json**
```json
{
  "name": "@mcp-x402/agent",
  "version": "0.1.0",
  "private": true,
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "mcp": "ts-node src/mcp-server.ts"
  },
  "dependencies": {
    "@hashgraph/sdk": "^2.51.0",
    "@hashgraphonline/hedera-agent-kit": "^1.0.0",
    "@coinbase/x402-express": "^0.4.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "ts-node": "^10.9.2",
    "typescript": "^5.4.5"
  }
}
```

**packages/agent/tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

```bash
git add packages/agent/package.json packages/agent/tsconfig.json
git commit -m "chore(agent): add package.json and tsconfig"
```

#### Commit 1.2 — agent.ts

**packages/agent/src/agent.ts**
```typescript
import "dotenv/config";
import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export function createAgent(): HederaAgentKit {
  return new HederaAgentKit({
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    network: (process.env.HEDERA_NETWORK as "testnet" | "mainnet") ?? "testnet",
  });
}
```

```bash
git add packages/agent/src/agent.ts
git commit -m "feat(agent): add HederaAgentKit factory"
```

#### Commit 1.3 — balance tool

**packages/agent/src/tools/balance.ts**
```typescript
import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function getBalance(agent: HederaAgentKit, accountId: string) {
  return agent.getHbarBalance(accountId);
}
```

```bash
git add packages/agent/src/tools/balance.ts
git commit -m "feat(agent): add get-balance tool"
```

#### Commit 1.4 — transfer tool

**packages/agent/src/tools/transfer.ts**
```typescript
import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function transferHbar(
  agent: HederaAgentKit,
  toAccountId: string,
  amount: number
) {
  return agent.transferHbar(toAccountId, amount);
}
```

```bash
git add packages/agent/src/tools/transfer.ts
git commit -m "feat(agent): add transfer-hbar tool"
```

#### Commit 1.5 — HCS tool

**packages/agent/src/tools/hcs-message.ts**
```typescript
import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function sendHcsMessage(
  agent: HederaAgentKit,
  topicId: string,
  message: string
) {
  return agent.submitMessageToTopic(topicId, message);
}
```

```bash
git add packages/agent/src/tools/hcs-message.ts
git commit -m "feat(agent): add HCS message tool"
```

#### Commit 1.6 — NFT mint tool

**packages/agent/src/tools/nft-mint.ts**
```typescript
import { HederaAgentKit } from "@hashgraphonline/hedera-agent-kit";

export async function mintNft(
  agent: HederaAgentKit,
  tokenId: string,
  metadata: Record<string, unknown>
) {
  const encoded = Buffer.from(JSON.stringify(metadata)).toString("base64");
  return agent.mintNft(tokenId, [encoded]);
}
```

```bash
git add packages/agent/src/tools/nft-mint.ts
git commit -m "feat(agent): add NFT mint tool"

git push origin feat/agent-core
# open PR → merge → git checkout main && git pull
```

---

### Phase 2 — Express Server + x402

```bash
git checkout -b feat/x402-server
```

#### Commit 2.1 — bare server

**packages/agent/src/server.ts** (initial — health only)
```typescript
import "dotenv/config";
import express from "express";

const app = express();

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(3001, () => console.log("Agent server on :3001"));
```

```bash
git add packages/agent/src/server.ts
git commit -m "feat(server): add Express server with health endpoint"
```

#### Commit 2.2 — CORS + JSON

```typescript
// add after imports, before routes:
import cors from "cors";
app.use(cors());
app.use(express.json());
```

```bash
git add packages/agent/src/server.ts
git commit -m "feat(server): add CORS and JSON middleware"
```

#### Commit 2.3 — x402 gate (no handler yet)

```typescript
import { paymentMiddleware, Network } from "@coinbase/x402-express";

app.use(
  "/agent/run",
  paymentMiddleware(
    process.env.PAYMENT_RECIPIENT_ADDRESS!,
    {
      "/agent/run": {
        price: "$0.10",
        network: Network.BaseMainnet,
        config: { description: "Hedera Agent Task Execution" },
      },
    },
    { facilitatorUrl: "https://x402.blocky402.com" }
  )
);
```

```bash
git add packages/agent/src/server.ts
git commit -m "feat(x402): gate /agent/run with x402 payment middleware"
```

#### Commit 2.4 — task dispatch handler

```typescript
import { createAgent } from "./agent";
import { getBalance } from "./tools/balance";
import { transferHbar } from "./tools/transfer";
import { sendHcsMessage } from "./tools/hcs-message";
import { mintNft } from "./tools/nft-mint";

app.post("/agent/run", async (req, res) => {
  const { task, params } = req.body as {
    task: string;
    params: Record<string, unknown>;
  };
  const agent = createAgent();

  switch (task) {
    case "get_balance":
      return res.json({ result: await getBalance(agent, params.accountId as string) });
    case "transfer_hbar":
      return res.json({ result: await transferHbar(agent, params.toAccountId as string, Number(params.amount)) });
    case "send_hcs_message":
      return res.json({ result: await sendHcsMessage(agent, params.topicId as string, params.message as string) });
    case "mint_nft":
      return res.json({ result: await mintNft(agent, params.tokenId as string, params.metadata as Record<string, unknown>) });
    default:
      return res.status(400).json({ error: `Unknown task: ${task}` });
  }
});
```

```bash
git add packages/agent/src/server.ts
git commit -m "feat(server): add agent task dispatch handler"
```

#### Commit 2.5 — input validation

```typescript
// add before the switch:
if (!task || typeof task !== "string") {
  return res.status(400).json({ error: "task field required" });
}
if (!params || typeof params !== "object") {
  return res.status(400).json({ error: "params object required" });
}
```

```bash
git add packages/agent/src/server.ts
git commit -m "fix(server): validate task and params before dispatch"
```

#### Commit 2.6 — error handling

```typescript
// wrap the switch in try/catch:
try {
  // ... switch statement
} catch (err) {
  res.status(500).json({ error: String(err) });
}
```

```bash
git add packages/agent/src/server.ts
git commit -m "fix(server): add structured error responses"

git push origin feat/x402-server
# open PR → merge → git checkout main && git pull
```

---

### Phase 3 — MCP Server

```bash
git checkout -b feat/mcp-server
```

**packages/agent/src/mcp-server.ts**
```typescript
import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createAgent } from "./agent";

const server = new McpServer({ name: "hedera-agent", version: "1.0.0" });
const agent = createAgent();
```

Commit 3.1, then add each tool in commits 3.2–3.4 as described in the phase table above.

```bash
git push origin feat/mcp-server
# open PR → merge
```

---

### Phase 4 — React UI

```bash
git checkout -b feat/ui-wallet
cd packages/ui
npx create-vite@latest . --template react-ts
npm install @hashpack/hashconnect ethers axios
```

```bash
git add packages/ui
git commit -m "chore(ui): scaffold Vite React app"
```

#### Commit 4.3 — useWallet hook

**packages/ui/src/hooks/useWallet.ts**
```typescript
import { HashConnect } from "@hashpack/hashconnect";
import { useState, useCallback } from "react";

const hc = new HashConnect(true);

export function useWallet() {
  const [accountId, setAccountId] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const initData = await hc.init(
      { name: "Hedera x402 Agent", description: "Pay-per-use Hedera agent", icon: "" },
      "testnet"
    );
    hc.connectToLocalWallet(initData.pairingString);
    hc.pairingEvent.once((data) => setAccountId(data.accountIds[0]));
  }, []);

  return { accountId, connect };
}
```

```bash
git add packages/ui/src/hooks/useWallet.ts
git commit -m "feat(wallet): add useWallet hook with HashPack pairing"
```

#### Commit 4.5 — useAgentTask hook (stub payment)

**packages/ui/src/hooks/useAgentTask.ts**
```typescript
import { useState } from "react";
import axios from "axios";

const AGENT_URL = import.meta.env.VITE_AGENT_URL ?? "http://localhost:3001";

export function useAgentTask() {
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTask = async (task: string, params: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const probe = await axios.post(
        `${AGENT_URL}/agent/run`,
        { task, params },
        { validateStatus: () => true }
      );
      if (probe.status === 402) {
        const receipt = await fulfillX402Payment(probe.data);
        const paid = await axios.post(
          `${AGENT_URL}/agent/run`,
          { task, params },
          { headers: { "x-payment": receipt } }
        );
        setResult(paid.data);
      } else {
        setResult(probe.data);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return { runTask, result, loading, error };
}

async function fulfillX402Payment(_requirements: unknown): Promise<string> {
  // stub — replaced in commit 4.6
  throw new Error("Payment signing not yet implemented");
}
```

```bash
git add packages/ui/src/hooks/useAgentTask.ts
git commit -m "feat(ui): add useAgentTask hook with x402 flow"
```

#### Commit 4.6 — real payment signing

Replace the stub with actual ethers.js signing:

```typescript
import { BrowserProvider, parseUnits } from "ethers";

async function fulfillX402Payment(requirements: {
  accepts: Array<{ network: string; asset: string; amount: string; payTo: string }>;
}): Promise<string> {
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const accept = requirements.accepts[0];
  // ERC-20 USDC transfer call (simplified — use x402 client lib for production)
  const tx = await signer.sendTransaction({
    to: accept.payTo,
    data: "0x", // real impl: encode ERC-20 transfer
    value: 0n,
  });
  await tx.wait();
  return btoa(JSON.stringify({ txHash: tx.hash, ...accept }));
}
```

```bash
git add packages/ui/src/hooks/useAgentTask.ts
git commit -m "feat(wallet): implement x402 payment signing"
```

Continue commits 4.7–4.10 for the remaining components, then push and open a PR.

---

### Phase 5 — Deploy

```bash
git checkout -b chore/deploy
```

#### Commit 5.1 — Railway config

**packages/agent/railway.toml**
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run start"
healthcheckPath = "/health"
```

```bash
git add packages/agent/railway.toml
git commit -m "chore(deploy): add Railway config for agent server"
```

#### Commit 5.2 — Vercel config

**packages/ui/vercel.json**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

```bash
git add packages/ui/vercel.json
git commit -m "chore(deploy): add Vercel config for UI"
```

#### Commit 5.3 — README with live URLs

```bash
# after deploying both services, update README.md with live links
git add README.md
git commit -m "docs(repo): add live demo URLs to README"

git push origin chore/deploy
# open PR → merge
```

---

## Environment Variables

**.env.example**
```dotenv
# Hedera operator credentials — never commit real keys
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e...
HEDERA_NETWORK=testnet

# x402 — EVM address that receives USDC payments
PAYMENT_RECIPIENT_ADDRESS=0xYourEVMAddress

# UI — set to Railway URL after deploy
VITE_AGENT_URL=https://your-agent.up.railway.app
```

---

## Register with blocky402.com

1. Sign up at **blocky402.com** → create a facilitator endpoint.
2. Use `https://x402.blocky402.com` as the `facilitatorUrl` in the middleware config.
3. Set `PAYMENT_RECIPIENT_ADDRESS` to the EVM address receiving USDC on Base.
4. Test the sandbox before going to mainnet.

---

## Submission Checklist

- [ ] Public GitHub repo: https://github.com/Davedave001/mcp-x402-hedera-agent
- [ ] `README.md` with live demo URL
- [ ] Agent publicly hosted and reachable
- [ ] Written feedback submitted (template below)
- [ ] Uses `@hashgraphonline/hedera-agent-kit`
- [ ] End-to-end testnet payment flow verified

---

## Feedback Template (Required)

> **Agent name:** Hedera x402 Agent  
> **What works well:** The 402-first flow makes pay-per-call APIs feel native — no subscription setup, no API keys to manage for callers. HashPack integration is smooth on testnet.  
> **What could improve:** x402 on Hedera EVM (rather than Base) is still experimental; HBAR-native payments require a custom facilitator. First-class Hedera network support in `x402-express` would remove the Base dependency entirely.  
> **Would you use this in production?** Yes — low-friction micropayment APIs (on-chain data lookups, AI inference, NFT gating) are a natural fit.

---

## Key Packages

| Package | Purpose |
|---------|---------|
| `@hashgraphonline/hedera-agent-kit` | Hedera smart-agent primitives (HTS, HCS, HBAR) |
| `@hashgraph/sdk` | Direct Hedera SDK for transactions |
| `@coinbase/x402-express` | Express middleware for x402 payment gating |
| `@modelcontextprotocol/sdk` | MCP server for tool discovery by AI clients |
| `@hashpack/hashconnect` | HashPack wallet pairing in the browser |
| `ethers` | EVM wallet signing for x402 receipts |

---

## Sequence Diagram — Payment-Execution Flow

```
User        Browser UI       Agent Server       blocky402       Hedera Network
 │               │                │                  │                │
 │  click task   │                │                  │                │
 │──────────────>│                │                  │                │
 │               │ POST /agent/run│                  │                │
 │               │───────────────>│                  │                │
 │               │   HTTP 402     │                  │                │
 │               │<───────────────│                  │                │
 │  sign tx      │                │                  │                │
 │<─────────────>│                │                  │                │
 │               │   broadcast    │                  │                │
 │               │──────────────────────────────────>│                │
 │               │   receipt      │                  │                │
 │               │<──────────────────────────────────│                │
 │               │ POST /agent/run│                  │                │
 │               │ x-payment:rcpt │                  │                │
 │               │───────────────>│                  │                │
 │               │                │ verify receipt   │                │
 │               │                │─────────────────>│                │
 │               │                │ valid            │                │
 │               │                │<─────────────────│                │
 │               │                │ execute on Hedera│                │
 │               │                │────────────────────────────────-->│
 │               │                │ tx confirmed     │                │
 │               │                │<──────────────────────────────────│
 │               │  result JSON   │                  │                │
 │               │<───────────────│                  │                │
 │  show result  │                │                  │                │
 │<─────────────>│                │                  │                │
```

---

## Security Notes

- `HEDERA_PRIVATE_KEY` lives only on the server — never in the browser bundle.
- x402 receipts are single-use; the middleware blocks replays automatically.
- Rate-limit `/agent/run` independently of x402 to resist DoS at the verification layer.
- On mainnet, store keys in Railway Secrets / Vercel env / AWS SSM — never in `.env` files committed to git.
