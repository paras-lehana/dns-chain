# NeuraDNS Documentation Index

Welcome to the NeuraDNS documentation. This index helps you navigate the project documentation.

## Quick Links

| Document | Description |
|----------|-------------|
| [README.md](../README.md) | Project overview and quick start |
| [PITCH_DOCUMENT.md](../PITCH_DOCUMENT.md) | Hackathon pitch and business case |
| [example_usage.md](../example_usage.md) | API usage examples with curl |

## Architecture & Design

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Complete system architecture |
| [AI_VALIDATION_PROMPT.md](./AI_VALIDATION_PROMPT.md) | AI validation system prompt |

## Deployment & Setup

| Document | Description |
|----------|-------------|
| [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) | Server deployment instructions |
| [N8N_SETUP.md](./N8N_SETUP.md) | n8n workflow configuration |

## Smart Contracts

| Document | Description |
|----------|-------------|
| [neura_dns.rs](../contracts/neura_dns.rs) | Solana smart contract source |

## For Developers

| Document | Description |
|----------|-------------|
| [AGENTS.md](../AGENTS.md) | Agent/AI context documentation |
| [llm.txt](../llm.txt) | LLM-friendly project summary |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Contribution guidelines |

## External Resources

- [Solana Explorer - Program](https://explorer.solana.com/address/H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM?cluster=devnet)
- [Live Demo](http://82.112.235.26:8765)
- [QIE Blockchain Hackathon](https://qie-blockchain-hackathon.hackerearth.com/)

---

## Project Structure

```
neuradns/
├── README.md                 # Main readme
├── PITCH_DOCUMENT.md        # Hackathon pitch
├── example_usage.md         # API examples
├── AGENTS.md                # Agent documentation
├── llm.txt                  # LLM context
├── LICENSE                  # MIT license
├── CONTRIBUTING.md          # Contribution guide
├── .gitignore               # Git ignore rules
│
├── blockchain_dns_register/ # Main application
│   ├── production-api.ts    # Node.js API
│   ├── app.py               # Flask UI
│   ├── index.html           # Frontend
│   └── ...
│
├── contracts/               # Smart contracts
│   └── neura_dns.rs         # Solana program
│
├── docs/                    # Documentation
│   ├── README.md            # This file
│   ├── ARCHITECTURE.md      # System design
│   ├── DEPLOYMENT_GUIDE.md  # Deployment
│   └── N8N_SETUP.md         # AI workflow
│
└── public/                  # Static assets
    └── index.html           # Frontend UI
```

---

*NeuraDNS - AI-Powered Decentralized DNS*
