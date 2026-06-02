# Hedera x402 Agent

A pay-per-use AI agent built with the [Hedera Agent Kit](https://github.com/hashgraph-online/hedera-agent-kit) and gated behind the [x402 payment protocol](https://x402.org) via [blocky402.com](https://blocky402.com).

**Live demo:** _coming soon — add URL after Railway + Vercel deploy_  
**GitHub:** https://github.com/Davedave001/mcp-x402-hedera-agent

---

## What it does

1. A user selects a Hedera task (balance check, HBAR transfer, HCS message, NFT mint).
2. The browser probes the API — the server responds with HTTP 402 and payment requirements.
3. The user's EVM wallet signs a USDC micro-payment (~$0.01–$0.25) on Base via blocky402.
4. The server verifies the receipt and executes the Hedera task.
5. The result is returned and displayed in the UI — the whole flow takes under 5 seconds.

---

## Architecture

```
React UI (Vercel)
  └─ POST /agent/run ──► Express server (Railway)
                              └─ x402 middleware ──► blocky402.com
                              └─ Hedera Agent Kit ──► Hedera Testnet
```

---

## Quick Start

### Prerequisites

- Node.js ≥ 20
- A [Hedera Testnet account](https://portal.hedera.com)
- A [blocky402.com](https://blocky402.com) facilitator endpoint
- MetaMask (or any EIP-1193 wallet) with Base network + USDC

### 1. Clone and install

```bash
git clone https://github.com/Davedave001/mcp-x402-hedera-agent.git
cd mcp-x402-hedera-agent
npm install
```

### 2. Configure environment

```bash
cp .env.example packages/agent/.env
# Fill in HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, PAYMENT_RECIPIENT_ADDRESS
```

### 3. Run locally

```bash
# Terminal 1 — agent server
npm run agent

# Terminal 2 — UI dev server
npm run ui
```

Open http://localhost:5173, connect your wallet, and run a task.

---

## Project Structure

```
packages/
  agent/         Express server + x402 middleware + Hedera Agent Kit tools
    src/
      agent.ts          HederaAgentKit factory
      server.ts         Express + x402 entry point
      mcp-server.ts     MCP tool server (stdio)
      tools/
        balance.ts      get HBAR balance
        transfer.ts     transfer HBAR
        hcs-message.ts  submit HCS message
        nft-mint.ts     mint NFT
  ui/            React + Vite front-end
    src/
      hooks/
        useWallet.ts    EVM wallet connection (ethers.js)
        useAgentTask.ts x402 probe → pay → retry flow
      components/
        WalletConnect.tsx
        TaskSelector.tsx
        ResultDisplay.tsx
      App.tsx
```

---

## Deploying

### Backend — Railway

```bash
cd packages/agent
railway init
railway up
# Add env vars in Railway dashboard
```

### Frontend — Vercel

```bash
cd packages/ui
vercel deploy --prod
# Set VITE_AGENT_URL in Vercel project settings
```

---

## MCP Tool Server

The agent also exposes its tools over the [Model Context Protocol](https://modelcontextprotocol.io) for use with Claude Desktop or any MCP-compatible client:

```bash
npm run mcp --workspace=packages/agent
```

Register in Claude Desktop config:
```json
{
  "mcpServers": {
    "hedera-agent": {
      "command": "node",
      "args": ["packages/agent/dist/mcp-server.js"]
    }
  }
}
```

---

## Feedback

> **What works well:** The x402 402-first flow makes pay-per-call APIs feel native — no subscription setup, no API keys to manage for callers. The ethers.js + Base USDC path is straightforward to implement.  
> **What could improve:** x402 on Hedera EVM natively (rather than bridging through Base) would remove the cross-chain dependency entirely. First-class Hedera network support in `x402-express` would be a significant quality-of-life improvement.  
> **Production-ready?** Yes for testnet/demo workloads — with proper secret management and rate limiting it's suitable for mainnet micropayment APIs.

---

## License

MIT
