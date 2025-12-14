# NeuraDNS — Agent Documentation

This document provides context for AI agents and developers working on the NeuraDNS project.

## Project Overview

NeuraDNS is an AI-powered decentralized Domain Name System built on Solana blockchain. It combines AI validation with blockchain immutability to create a secure, fraud-resistant DNS infrastructure.

## Architecture Summary

```
User Browser → Flask UI (8765) → Node.js API (3007) → [AI Layer + Solana Blockchain]
```

### Components

1. **Flask UI Server** (`src/ui/app.py`)
   - Serves static HTML frontend
   - Proxies API requests to Node.js backend
   - Port: 8765

2. **Node.js API** (`src/api/production-api.ts`)
   - Handles blockchain operations
   - Integrates with AI validation via n8n webhook
   - Port: 3007

3. **AI Validation Layer** (n8n + Groq LLM)
   - Real-time domain validation
   - Homograph attack detection
   - Typosquatting prevention
   - Webhook: `https://n8n.backend.lehana.in/webhook/validate_domain`

4. **Solana Smart Contract** (`contracts/neura_dns.rs`)
   - Program ID: `H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM`
   - Network: Devnet
   - PDA Seeds: `["domain", domain_name]`

## Key Files

| File | Purpose |
|------|---------|
| `README.md` | Main project documentation |
| `PITCH_DOCUMENT.md` | Hackathon pitch presentation |
| `example_usage.md` | API usage examples with curl |
| `blockchain_dns_register/production-api.ts` | Blockchain API server |
| `blockchain_dns_register/app.py` | Flask UI server |
| `blockchain_dns_register/index.html` | Frontend UI |
| `contracts/neura_dns.rs` | Solana smart contract |
| `docs/ARCHITECTURE.md` | Detailed system architecture |
| `docs/DEPLOYMENT_GUIDE.md` | Server deployment instructions |
| `docs/N8N_SETUP.md` | n8n workflow configuration |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve frontend UI |
| `/health` | GET | UI server health check |
| `/api/health` | GET | API server health check |
| `/api/validate` | POST | Validate domain + IP with AI |
| `/api/register` | POST | Register domain on blockchain |
| `/api/resolve` | GET | Resolve domain from blockchain |

## Environment Variables

```
PORT=3007                    # API server port
N8N_WEBHOOK_URL=https://...  # AI validation webhook
NODE_ENV=production          # Environment
```

## Development Commands

```bash
# Start API server
cd blockchain_dns_register
npx ts-node production-api.ts

# Start UI server
python app.py

# Production (PM2)
pm2 start "npx ts-node production-api.ts" --name neuradns-api
pm2 start "python app.py" --name neuradns-ui
```

## Blockchain Details

- **Program ID**: `H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM`
- **Wallet Address**: `8MBPvYsG7a1SC6Jz83VxcFEVkeRs3B1PRMEqk1mxyUf7`
- **Network**: Solana Devnet
- **Explorer**: https://explorer.solana.com/address/H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM?cluster=devnet

## AI Validation Rules

The AI layer validates domains using the following rules:

1. **REJECT Well-Known Domains**: google.com, facebook.com, microsoft.com, etc.
2. **REJECT Homograph Attacks**: rnicrosoft.com (rn mimics m)
3. **REJECT Private IPs**: 192.168.x.x, 10.x.x.x, 127.x.x.x
4. **ACCEPT Blockchain Keywords**: Contains "web3", "blockchain", "crypto"
5. **ACCEPT Long Unique Names**: 15+ characters with unique patterns

## Code Conventions

- TypeScript for Node.js API
- Python (Flask) for UI server
- Rust (Anchor) for smart contracts
- Pure HTML/CSS/JS for frontend

## Testing

```bash
# Validate a domain
curl -X POST http://localhost:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{"domain": "test.blockchain", "ip": "8.8.8.8"}'

# Register a domain
curl -X POST http://localhost:8765/api/register \
  -H "Content-Type: application/json" \
  -d '{"domain": "test.blockchain", "ip": "8.8.8.8"}'

# Resolve a domain
curl -X GET "http://localhost:8765/api/resolve?domain=test.blockchain"
```

## Hackathon Context

- **Event**: QIE Blockchain Hackathon 2025
- **Tracks**: AI x Blockchain, Identity & Security
- **Prize**: $2,500 (Neural Chain Award)
- **Deadline**: December 14, 2025

## Contact

- **Demo**: http://82.112.235.26:8765
- **GitHub**: [Repository URL]
