# NeuraDNS — API Usage Examples

This document provides comprehensive examples for using the NeuraDNS API endpoints.

## Base URL

- **Production**: `http://82.112.235.26:8765`
- **Local Development**: `http://localhost:8765`

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Validate Domain](#2-validate-domain)
3. [Register Domain](#3-register-domain)
4. [Resolve Domain](#4-resolve-domain)
5. [Error Handling](#5-error-handling)
6. [Integration Examples](#6-integration-examples)

---

## 1. Health Check

Verify that the API is running and connected to the blockchain.

### Request

```bash
curl -X GET http://82.112.235.26:8765/health
```

### Response

```json
{
  "status": "running",
  "ui_server": "Flask",
  "port": 8765
}
```

### API Health (Backend)

```bash
curl -X GET http://82.112.235.26:8765/api/health
```

```json
{
  "success": true,
  "message": "Neura DNS API is running",
  "cluster": "Devnet",
  "programId": "H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM"
}
```

---

## 2. Validate Domain

Check if a domain is available and passes AI validation before registration.

### Request

```bash
curl -X POST http://82.112.235.26:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "myblockchainapp.web3",
    "ip": "8.8.8.8"
  }'
```

### Successful Validation Response

```json
{
  "success": true,
  "exists": false,
  "available": true,
  "valid": true,
  "reason": "Valid domain with unique blockchain-related naming pattern",
  "confidence": 0.95,
  "aiValidation": {
    "valid": true,
    "reason": "Valid domain with unique blockchain-related naming pattern",
    "confidence": 0.95,
    "checks": {
      "domainFormat": true,
      "ipFormat": true,
      "ipRoutable": true,
      "suspiciousPattern": false,
      "tldValid": true,
      "isWellKnownDomain": false,
      "isPrivateIP": false
    },
    "riskLevel": "low",
    "aiProvider": "Groq",
    "processedAt": "2024-12-14T10:30:00Z"
  }
}
```

### Domain Already Registered

```bash
curl -X POST http://82.112.235.26:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "existingdomain.blockchain",
    "ip": "1.2.3.4"
  }'
```

```json
{
  "success": false,
  "exists": true,
  "valid": false,
  "message": "Domain \"existingdomain.blockchain\" is already registered",
  "data": {
    "domain": "existingdomain.blockchain",
    "ip": "5.6.7.8",
    "accountAddress": "7YkH9QxM..."
  }
}
```

### AI Rejection — Well-Known Domain

```bash
curl -X POST http://82.112.235.26:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "google.com",
    "ip": "8.8.8.8"
  }'
```

```json
{
  "success": false,
  "exists": false,
  "available": true,
  "valid": false,
  "reason": "google.com is a well-known globally registered domain that cannot be registered",
  "confidence": 0.99,
  "aiValidation": {
    "valid": false,
    "reason": "google.com is a well-known globally registered domain",
    "confidence": 0.99,
    "checks": {
      "domainFormat": true,
      "ipFormat": true,
      "ipRoutable": true,
      "suspiciousPattern": false,
      "tldValid": true,
      "isWellKnownDomain": true,
      "isPrivateIP": false
    },
    "riskLevel": "high"
  }
}
```

### AI Rejection — Homograph Attack

```bash
curl -X POST http://82.112.235.26:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "rnicrosoft.com",
    "ip": "1.2.3.4"
  }'
```

```json
{
  "success": false,
  "valid": false,
  "reason": "Homograph attack detected: 'rn' mimics 'm' in 'microsoft'. This appears to be a typosquatting attempt.",
  "confidence": 0.98,
  "aiValidation": {
    "valid": false,
    "checks": {
      "domainFormat": true,
      "suspiciousPattern": true,
      "isWellKnownDomain": true
    },
    "riskLevel": "high"
  }
}
```

### AI Rejection — Private IP

```bash
curl -X POST http://82.112.235.26:8765/api/validate \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mysite.blockchain",
    "ip": "192.168.1.1"
  }'
```

```json
{
  "success": false,
  "valid": false,
  "reason": "Private IP address (192.168.x.x) is not publicly routable",
  "confidence": 0.99,
  "aiValidation": {
    "valid": false,
    "checks": {
      "domainFormat": true,
      "ipFormat": true,
      "ipRoutable": false,
      "isPrivateIP": true
    },
    "riskLevel": "high"
  }
}
```

---

## 3. Register Domain

Register a domain on the Solana blockchain after AI validation passes.

### Request

```bash
curl -X POST http://82.112.235.26:8765/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mynewdomain.blockchain",
    "ip": "203.0.113.50"
  }'
```

### Successful Registration Response

```json
{
  "success": true,
  "message": "Domain registered successfully on blockchain",
  "aiValidation": {
    "passed": true,
    "confidence": 0.95,
    "checks": {
      "domainFormat": true,
      "ipFormat": true,
      "ipRoutable": true,
      "suspiciousPattern": false,
      "isWellKnownDomain": false,
      "isPrivateIP": false
    },
    "riskLevel": "low"
  },
  "data": {
    "domain": "mynewdomain.blockchain",
    "ip": "203.0.113.50",
    "transaction": "5UxH7zKmJv9QpRtY3nB8wL2dF4gS6hA9kM1cX7vE2rP8",
    "domainAccount": "7YkH9QxM5sT2nL8pJ3wE1vR6bC4dF9aG2hK5mN7xQ0sU",
    "explorer": "https://explorer.solana.com/tx/5UxH7zKmJv9QpRtY3nB8wL2dF4gS6hA9kM1cX7vE2rP8?cluster=devnet"
  }
}
```

### Registration Failed — AI Rejection

```bash
curl -X POST http://82.112.235.26:8765/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "facebook.com",
    "ip": "8.8.8.8"
  }'
```

```json
{
  "success": false,
  "error": "Validation failed",
  "reason": "facebook.com is a well-known globally registered domain",
  "confidence": 0.99,
  "aiChecked": true
}
```

---

## 4. Resolve Domain

Query the blockchain for a registered domain's IP address.

### Request

```bash
curl -X GET "http://82.112.235.26:8765/api/resolve?domain=mynewdomain.blockchain"
```

### Successful Resolution

```json
{
  "success": true,
  "data": {
    "domain": "mynewdomain.blockchain",
    "ip": "203.0.113.50",
    "accountAddress": "7YkH9QxM5sT2nL8pJ3wE1vR6bC4dF9aG2hK5mN7xQ0sU"
  }
}
```

### Domain Not Found

```bash
curl -X GET "http://82.112.235.26:8765/api/resolve?domain=nonexistent.domain"
```

```json
{
  "success": false,
  "error": "Domain not found on blockchain"
}
```

---

## 5. Error Handling

### Missing Required Fields

```bash
curl -X POST http://82.112.235.26:8765/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "mysite.com"
  }'
```

```json
{
  "success": false,
  "error": "Missing required fields: domain and ip"
}
```

### Invalid JSON

```bash
curl -X POST http://82.112.235.26:8765/api/register \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

```json
{
  "success": false,
  "error": "Invalid JSON payload"
}
```

### Server Error

```json
{
  "success": false,
  "error": "Internal server error",
  "details": "Connection to blockchain failed"
}
```

---

## 6. Integration Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://82.112.235.26:8765';

// Validate a domain
async function validateDomain(domain, ip) {
  try {
    const response = await axios.post(`${API_BASE}/api/validate`, {
      domain,
      ip
    });
    return response.data;
  } catch (error) {
    console.error('Validation failed:', error.response?.data || error.message);
    throw error;
  }
}

// Register a domain
async function registerDomain(domain, ip) {
  try {
    const response = await axios.post(`${API_BASE}/api/register`, {
      domain,
      ip
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

// Resolve a domain
async function resolveDomain(domain) {
  try {
    const response = await axios.get(`${API_BASE}/api/resolve`, {
      params: { domain }
    });
    return response.data;
  } catch (error) {
    console.error('Resolution failed:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage
(async () => {
  // Step 1: Validate
  const validation = await validateDomain('myapp.blockchain', '1.2.3.4');
  console.log('Validation:', validation);

  if (validation.valid) {
    // Step 2: Register
    const registration = await registerDomain('myapp.blockchain', '1.2.3.4');
    console.log('Registration:', registration);

    // Step 3: Resolve
    const resolved = await resolveDomain('myapp.blockchain');
    console.log('Resolved:', resolved);
  }
})();
```

### Python

```python
import requests

API_BASE = "http://82.112.235.26:8765"

def validate_domain(domain: str, ip: str) -> dict:
    """Validate a domain with AI before registration."""
    response = requests.post(
        f"{API_BASE}/api/validate",
        json={"domain": domain, "ip": ip}
    )
    return response.json()

def register_domain(domain: str, ip: str) -> dict:
    """Register a domain on the blockchain."""
    response = requests.post(
        f"{API_BASE}/api/register",
        json={"domain": domain, "ip": ip}
    )
    return response.json()

def resolve_domain(domain: str) -> dict:
    """Resolve a domain from the blockchain."""
    response = requests.get(
        f"{API_BASE}/api/resolve",
        params={"domain": domain}
    )
    return response.json()

# Example usage
if __name__ == "__main__":
    # Validate
    result = validate_domain("myapp.blockchain", "1.2.3.4")
    print(f"Validation: {result}")

    if result.get("valid"):
        # Register
        reg = register_domain("myapp.blockchain", "1.2.3.4")
        print(f"Registration: {reg}")

        # Resolve
        resolved = resolve_domain("myapp.blockchain")
        print(f"Resolved: {resolved}")
```

### Shell Script

```bash
#!/bin/bash

API_BASE="http://82.112.235.26:8765"
DOMAIN="myapp.blockchain"
IP="1.2.3.4"

echo "=== NeuraDNS API Test ==="

# Step 1: Health check
echo -e "\n1. Health Check:"
curl -s "$API_BASE/health" | jq .

# Step 2: Validate domain
echo -e "\n2. Validating $DOMAIN -> $IP:"
VALIDATION=$(curl -s -X POST "$API_BASE/api/validate" \
  -H "Content-Type: application/json" \
  -d "{\"domain\": \"$DOMAIN\", \"ip\": \"$IP\"}")
echo "$VALIDATION" | jq .

# Step 3: Register if valid
VALID=$(echo "$VALIDATION" | jq -r '.valid')
if [ "$VALID" = "true" ]; then
  echo -e "\n3. Registering domain:"
  curl -s -X POST "$API_BASE/api/register" \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\", \"ip\": \"$IP\"}" | jq .

  # Step 4: Resolve
  echo -e "\n4. Resolving domain:"
  curl -s "$API_BASE/api/resolve?domain=$DOMAIN" | jq .
else
  echo -e "\n❌ Domain validation failed, skipping registration"
fi
```

---

## Response Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad Request — Missing or invalid parameters |
| `404` | Not Found — Domain not registered |
| `500` | Server Error — Blockchain or AI service failure |

---

## Rate Limits

| Endpoint | Rate Limit |
|----------|------------|
| `/api/validate` | 100 requests/minute |
| `/api/register` | 20 requests/minute |
| `/api/resolve` | 200 requests/minute |

---

## Best Practices

1. **Always validate before registering** — Save transaction costs by checking availability first
2. **Handle AI rejection gracefully** — Display the `reason` field to users
3. **Cache resolved domains** — Results are immutable once registered
4. **Use HTTPS in production** — Secure your API communications
5. **Implement retry logic** — Blockchain transactions may occasionally fail

---

<div align="center">

**NeuraDNS API Documentation**

For questions or support, visit our [GitHub Repository](https://github.com/your-org/neuradns)

</div>
