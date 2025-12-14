# 📦 NeuraDNS - Documentation Package
**Complete documentation for blockchain-based DNS with AI validation**

---

## 📄 Files Included

### 1. **COMPLETE_DOCUMENTATION.md**
**Complete system architecture and flow documentation**
- Full architecture diagram
- User flow (Check, Register, Resolve)
- All function explanations
- Component breakdown
- Deployment guide
- Security features

**What you'll learn:**
- How the entire system works end-to-end
- Every function in every component
- Data flow from browser to blockchain
- Why each technology was chosen

---

### 2. **SOLANA_SMART_CONTRACT.rs**
**Deployed Solana program source code**
- Program ID: `H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM`
- Complete Rust source code
- Detailed function comments
- PDA (Program Derived Address) explanation
- Usage examples

**Functions documented:**
- `register_request()` - Register domain on blockchain
- `resolve_domain()` - Query domain record
- `validate_domain_and_ip()` - Format validation
- Account structures and error codes

---

### 3. **N8N_AI_SYSTEM_PROMPT.md**
**AI validation prompt used in n8n Groq Agent**
- Complete system prompt with all rules
- Domain validation criteria
- IP address validation rules
- Risk assessment logic
- Accept/Reject examples
- Edge cases handling

**Validation Rules:**
- ❌ Blocks: google.com, facebook.com, etc.
- ❌ Rejects: Private IPs, short dictionary words
- ✅ Accepts: Blockchain keywords, long custom names
- 🎯 Risk levels: low, medium, high

---

## 🏗️ System Architecture Quick Reference

```
USER (Browser)
    ↓
FLASK UI Server (Port 8765)
  - Serves index.html
  - Proxies API requests
    ↓
NODE.JS API (Port 3007)
  - /validate - Check + AI
  - /register - AI + Blockchain
  - /resolve - Query blockchain
    ↓ (splits to two services)
    ↓
    ├─→ N8N + GROQ AI
    │   (Domain/IP validation)
    │
    └─→ SOLANA BLOCKCHAIN
        (Immutable storage)
```

---

## 🔑 Key Components

### **Solana Smart Contract**
- **Language**: Rust (Anchor Framework)
- **Network**: Devnet
- **Storage**: PDA-based accounts
- **Functions**: register, resolve
- **Validation**: On-chain format checks

### **Node.js Backend API**
- **Language**: TypeScript
- **Framework**: Express
- **Port**: 3007 (internal)
- **Functions**: validate, register, resolve, health
- **Integration**: Solana Web3.js + n8n webhook

### **Flask UI Server**
- **Language**: Python
- **Framework**: Flask
- **Port**: 8765 (public)
- **Purpose**: Serve UI + Proxy API
- **Benefit**: Single port, CORS handling

### **n8n AI Validation**
- **Tool**: n8n (workflow automation)
- **Model**: Groq llama-3.1-70b
- **Purpose**: Smart domain validation
- **Blocks**: Well-known domains, private IPs
- **Accepts**: Blockchain terms, custom names

---

## 📊 Data Flow Examples

### **Checking Domain:**
```
1. User enters: myapp.blockchain.io + 8.8.8.8
2. Browser → Flask /api/validate
3. Flask → Node.js /validate
4. Node.js checks Solana (domain exists?)
5. Node.js → n8n AI validation
6. AI responds: {valid: true, confidence: 0.99}
7. Node.js → Flask → Browser
8. UI shows: ✅ Available (99% confidence)
```

### **Registering Domain:**
```
1. User clicks "Register on Blockchain"
2. Browser → Flask /api/register
3. Flask → Node.js /register
4. Node.js → n8n AI validation
5. AI approves → Node.js builds Solana transaction
6. Transaction sent to Devnet
7. Smart contract validates + stores
8. Returns signature: 5j4kL9m... 
9. UI shows: ✅ Success + Explorer link
```

---

## 🚀 Quick Start Guide

### **Access the System:**
```
http://82.112.235.26:8765
```

### **Test Domain Registration:**
1. Enter domain: `myproject.blockchain.io`
2. Enter IP: `8.8.8.8`
3. Click "Check Domain" → See AI validation
4. Click "Register on Blockchain" → Get transaction

### **View on Solana Explorer:**
```
https://explorer.solana.com/address/H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM?cluster=devnet
```

---

## 💡 Understanding Key Concepts

### **PDA (Program Derived Address)**
```rust
Seeds: ["domain", "example.com"]
↓
Generates deterministic address
↓
One unique account per domain
↓
No collisions, immutable
```

### **AI Validation Logic**
```
Domain length < 15 chars + .com/.net
  → Likely internet-registered
  → REJECT

Domain contains "blockchain"
  → Custom blockchain project
  → ACCEPT

IP in 192.168.x.x range
  → Private network
  → REJECT

IP = 8.8.8.8
  → Public Google DNS
  → ACCEPT
```

### **Transaction Flow**
```
1. Create instruction data
   - Discriminator (SHA256 hash)
   - Serialized strings (domain, IP)

2. Build transaction
   - Accounts: PDA, wallet, system program
   - Instruction: register_request

3. Sign with wallet
   - Private key from wallet.json

4. Send to Devnet
   - RPC: https://api.devnet.solana.com

5. Confirm transaction
   - Wait for finalization
   - Return signature
```

---

## 🎯 Common Use Cases

1. **Blockchain Project DNS**
   - Register: `myproject.blockchain.io`
   - Use for: Decentralized app domain

2. **Custom Business Domain**
   - Register: `company-blockchain-platform.com`
   - Use for: Enterprise blockchain solution

3. **Development Testing**
   - Register: `dev.testnet.blockchain`
   - Use for: Testing and staging

4. **NFT Project Domain**
   - Register: `nft-collection-mint.crypto`
   - Use for: NFT minting site

---

## 🔍 Debugging & Troubleshooting

### **Check if API is running:**
```bash
pm2 list
# Should show: neuradns-api (online) + neuradns-ui (online)
```

### **Test API directly:**
```bash
curl http://localhost:3007/health
# Returns: {"success":true,"message":"Neura DNS API is running"...}
```

### **View logs:**
```bash
pm2 logs neuradns-api --lines 50
pm2 logs neuradns-ui --lines 50
```

### **Test n8n webhook:**
```bash
curl -X POST https://n8n.backend.lehana.in/webhook/validate_domain \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.blockchain.io","ip":"8.8.8.8"}'
```

---

## 📚 Learning Resources

**Solana Development:**
- [Solana Docs](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)

**n8n Automation:**
- [n8n Documentation](https://docs.n8n.io/)
- [Groq AI](https://groq.com/)

**Web3 Concepts:**
- PDA (Program Derived Address)
- Transaction signing
- RPC communication
- On-chain storage

---

## 🎉 Success Metrics

✅ **Deployed**: Solana Devnet Program  
✅ **Running**: API + UI servers 24/7  
✅ **Validated**: AI-powered domain checking  
✅ **Immutable**: Blockchain storage  
✅ **Accessible**: Public URL for demos  

---

## 📞 Quick Reference

| Component | Technology | Port | Purpose |
|-----------|-----------|------|---------|
| Smart Contract | Rust/Anchor | N/A | On-chain storage |
| Backend API | Node.js/TypeScript | 3007 | Blockchain ops |
| UI Server | Python/Flask | 8765 | Serve UI + proxy |
| AI Validation | n8n + Groq | HTTPS | Domain validation |
| Frontend | HTML/CSS/JS | N/A | User interface |

---

**🚀 You now have everything needed to understand, deploy, and extend NeuraDNS!**

For questions or issues, refer to the detailed documentation files above.
