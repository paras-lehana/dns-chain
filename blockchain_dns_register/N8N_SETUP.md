# n8n Workflow Setup Guide

## 📤 Export Your n8n Workflow

### From Your Local n8n:

1. Open n8n: `http://localhost:5678`
2. Go to your validation workflow
3. Click **three dots (...)** menu > **Download**
4. Save as `n8n-workflow.json`
5. Copy this file to your deployment folder

---

## 📥 Import to Server n8n

### On Your Server:

1. **Access n8n**: `http://your-server-ip:5678`
2. **Create Account** (first time only)
3. Click **"Workflows"** in top menu
4. Click **"Import from File"** or **"Import from URL"**
5. Select `n8n-workflow.json`
6. Click **"Import"**
7. **Activate** the workflow (toggle switch in top right)

---

## ⚙️ Workflow Configuration

Your workflow should have these nodes:

### 1. Webhook Node
- **Method**: POST
- **Path**: `validate_domain` or `validate-domain`
- **Response**: "Respond to Webhook"

### 2. Debug Code Node (Optional)
```javascript
return [
  {
    json: {
      domain: $input.first().json.body.domain,
      ip: $input.first().json.body.ip,
      requestedBy: $input.first().json.body.requestedBy,
      timestamp: $input.first().json.body.timestamp
    }
  }
];
```

### 3. AI Agent Node
- **Chat Model**: Groq (or OpenAI)
- **Model**: llama-3.1-70b-versatile (or gpt-4)
- **System Message**: (Use the enhanced prompt I provided earlier)

### 4. Code Node - Parse Response
```javascript
const aiOutput = $input.first().json.output;

try {
  // Try to parse if it's a string
  const parsed = typeof aiOutput === 'string' ? JSON.parse(aiOutput) : aiOutput;
  
  return [{ json: parsed }];
} catch (e) {
  // If parsing fails, return error format
  return [{
    json: {
      valid: false,
      reason: "AI response parsing failed: " + aiOutput,
      confidence: 0.5,
      checks: {
        domainFormat: false,
        ipFormat: false,
        ipRoutable: false,
        suspiciousPattern: true,
        tldValid: false
      },
      riskLevel: "high"
    }
  }];
}
```

### 5. Respond to Webhook Node
- **Response**: JSON
- **Response Data**: `{{ $json }}`

---

## 🔗 Webhook URL

After activation, your webhook URL will be:
```
http://your-server-ip:5678/webhook-test/validate_domain
```

Update this in your `.env` file:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/validate_domain
```

---

## 🧪 Test Workflow

### From n8n UI:
1. Click "Execute Workflow" button
2. Enter test data in Webhook node
3. See results in each node

### From Command Line:
```bash
curl -X POST http://your-server-ip:5678/webhook-test/validate_domain \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "test.example.com",
    "ip": "8.8.8.8",
    "requestedBy": "test",
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

Expected response:
```json
{
  "valid": true,
  "reason": "All checks passed",
  "confidence": 0.95,
  "checks": {
    "domainFormat": true,
    "ipFormat": true,
    "ipRoutable": true,
    "suspiciousPattern": false,
    "tldValid": true
  },
  "riskLevel": "low"
}
```

---

## 🔒 Production Security

### Secure Your n8n:

1. **Change Default Port** (in systemd service):
   ```bash
   sudo nano /etc/systemd/system/n8n.service
   # Change N8N_PORT to something else
   ```

2. **Add Authentication**:
   ```bash
   # Add to systemd service:
   Environment="N8N_BASIC_AUTH_ACTIVE=true"
   Environment="N8N_BASIC_AUTH_USER=admin"
   Environment="N8N_BASIC_AUTH_PASSWORD=your-secure-password"
   ```

3. **Restrict Access** in Nginx:
   ```nginx
   location /n8n/ {
       allow YOUR_IP_ONLY;
       deny all;
       proxy_pass http://localhost:5678/;
   }
   ```

---

## 🐛 Troubleshooting

### Workflow Not Triggering:
```bash
# Check n8n logs
sudo journalctl -u n8n -f

# Test webhook directly
curl -X POST http://localhost:5678/webhook-test/validate_domain \
  -H "Content-Type: application/json" \
  -d '{"domain":"test.com","ip":"8.8.8.8"}'
```

### AI Agent Errors:
- Check API key is configured
- Verify model name is correct
- Check response format matches expectations

### Workflow Deactivated:
- Workflows deactivate on n8n restart
- Re-activate from UI after restart
- Or set to auto-activate in workflow settings

---

## 📊 Monitor Executions

In n8n UI:
1. Click "Executions" tab
2. See all workflow runs
3. Click any execution to see details
4. Debug failed executions

---

## 🔄 Update Workflow

To update the workflow:
1. Make changes in n8n UI
2. Save workflow
3. No need to restart API
4. Changes take effect immediately

---

## ✅ Verification Checklist

- [ ] Workflow imported successfully
- [ ] Webhook node configured
- [ ] AI Agent credentials set
- [ ] Workflow activated
- [ ] Test execution successful
- [ ] Webhook URL updated in .env
- [ ] API can reach n8n
- [ ] Security configured (if production)
