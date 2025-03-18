# Blockchain AI Agent

An intelligent AI agent for blockchain ecosystems that can interact with users via Telegram and perform various operations including token airdrops and blockchain queries on Rootstock.

## Features

- 🤖 AI-powered conversational interface
- 🎁 Automated token operations and queries
- 📱 Telegram bot integration
- 🔗 EVM compatibility
- 💡 Smart contract interaction
- 🔍 Blockchain explorer capabilities
- 🌉 Cross-chain compatibility

## Prerequisites

- Node.js (v16 or higher)
- Telegram Bot Token
- OpenAI API Key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cuongpo/rootstock-ai-agent.git
pnpm install
pnpm build
pnpm start --characters="./agent/characters/rootstock.character.json"
```

## Supported Blockchain Networks

### Rootstock (RSK) Mainnet
-   Network: Bitcoin-secured EVM-compatible sidechain
-   Explorer: https://rootstock.blockscout.com/
-   Features: Bitcoin merge-mining, two-way peg, EVM compatibility
-   RPC URL: https://public-node.rsk.co
-   Native Token: RBTC (pegged to BTC)
-   Block Time: ~30 seconds
-   API Documentation: https://docs.rootstock.io/
-   Blockscout API: https://rootstock.blockscout.com/api/v2/

#### Rootstock Integration Features
-   Address Balance Queries: Check RBTC balance of any address
-   Transaction Details: View comprehensive transaction information
-   Network Statistics: Monitor network health and performance
-   Block Information: Access detailed block data
-   Smart Contract Interaction: Communicate with EVM-compatible contracts
-   Cross-chain Operations: Interact with Bitcoin-pegged assets
