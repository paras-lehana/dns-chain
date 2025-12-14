"""
============================================================================
NEURADNS - FLASK UI SERVER
============================================================================

This module serves as the frontend server for NeuraDNS, providing:
1. Static HTML/CSS/JS serving for the web interface
2. API proxy to the Node.js blockchain backend
3. Health check endpoints

ARCHITECTURE:
    User Browser → Flask (port 8765) → Node.js API (port 3007) → Solana

WHY FLASK PROXY?
    - Single port exposure (8765) simplifies firewall rules
    - CORS handling in one place
    - Static file serving integrated
    - Clean separation of UI and API concerns

ENDPOINTS:
    GET  /             - Serve main UI page (index.html)
    GET  /health       - UI server health check
    GET  /api/health   - Proxy to API health check
    POST /api/validate - Proxy to domain validation
    POST /api/register - Proxy to blockchain registration
    GET  /api/resolve  - Proxy to domain resolution

CONFIGURATION:
    API_BASE_URL: Node.js backend URL (default: http://localhost:3007)
    HTML_FILE: Path to frontend HTML (default: public/index.html)

@author NeuraDNS Team
@version 1.0.0
@license MIT
============================================================================
"""

from flask import Flask, send_file, jsonify, request
import requests
import os

# ============================================================================
# APPLICATION INITIALIZATION
# ============================================================================

app = Flask(__name__)

# ============================================================================
# CONFIGURATION CONSTANTS
# ============================================================================

# Base URL for the Node.js blockchain API
# This server handles all Solana transactions and AI validation
API_BASE_URL = "http://localhost:3007"

# Path to the main HTML file served to users
# Contains the glassmorphism UI with domain registration form
HTML_FILE = "public/index.html"

# ============================================================================
# MAIN ROUTES
# ============================================================================

@app.route('/')
def index():
    """
    Serve the main NeuraDNS user interface.
    
    This route serves the single-page application containing:
    - Domain registration form (domain + IP inputs)
    - Check Domain button (triggers /api/validate)
    - Register button (triggers /api/register)
    - Results display with Solana Explorer links
    
    Returns:
        HTML file: The main index.html with glassmorphism UI
    """
    return send_file(HTML_FILE)

@app.route('/health')
def health():
    """
    Health check endpoint for the UI server.
    
    Used for:
    - Load balancer health checks
    - Monitoring systems
    - Debugging connectivity issues
    
    Returns:
        JSON: Server status information
        {
            "status": "running",
            "ui_server": "Flask",
            "port": 8765
        }
    """
    return jsonify({
        "status": "running",
        "ui_server": "Flask",
        "port": 8765
    })

# ============================================================================
# API PROXY ROUTES
# ============================================================================
# These routes forward requests to the Node.js blockchain API
# This pattern provides a unified interface on a single port
# ============================================================================

@app.route('/api/health', methods=['GET'])
def api_health():
    """
    Proxy to the blockchain API health endpoint.
    
    Checks the status of:
    - Node.js API server
    - Solana connection
    - Program ID configuration
    
    Returns:
        JSON: API health status from backend
    """
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        return response.json(), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/validate', methods=['POST'])
def api_validate():
    """
    Proxy to the domain validation endpoint.
    
    This endpoint performs:
    1. Blockchain check - Is domain already registered?
    2. AI validation - Does it pass fraud detection?
    
    Request Body:
        {
            "domain": "example.com",
            "ip": "8.8.8.8"
        }
    
    Returns:
        JSON: Validation result with AI confidence score
    """
    try:
        response = requests.post(
            f"{API_BASE_URL}/validate",
            json=request.json,
            headers={'Content-Type': 'application/json'}
        )
        return response.json(), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/register', methods=['POST'])
def api_register():
    """
    Proxy to the blockchain registration endpoint.
    
    This endpoint:
    1. Validates domain with AI
    2. Creates Solana transaction
    3. Signs and submits to blockchain
    4. Returns transaction signature
    
    Request Body:
        {
            "domain": "example.com",
            "ip": "8.8.8.8"
        }
    
    Returns:
        JSON: Registration result with Solana Explorer link
    """
    try:
        response = requests.post(
            f"{API_BASE_URL}/register",
            json=request.json,
            headers={'Content-Type': 'application/json'}
        )
        return response.json(), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/resolve', methods=['GET'])
def api_resolve():
    """
    Proxy to the domain resolution endpoint.
    
    Queries the Solana blockchain for a registered domain
    and returns the associated IP address.
    
    Query Parameters:
        domain: The domain name to resolve
    
    Returns:
        JSON: Domain record with IP address
        {
            "success": true,
            "data": {
                "domain": "example.com",
                "ip": "8.8.8.8",
                "accountAddress": "..."
            }
        }
    """
    try:
        domain = request.args.get('domain')
        response = requests.get(f"{API_BASE_URL}/resolve?domain={domain}")
        return response.json(), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================================
# APPLICATION ENTRY POINT
# ============================================================================

if __name__ == '__main__':
    """
    Start the NeuraDNS UI server.
    
    Startup Process:
    1. Verify HTML file exists
    2. Display configuration information
    3. Start Flask server on all interfaces (0.0.0.0)
    
    Configuration:
    - Host: 0.0.0.0 (accessible from external networks)
    - Port: 8765
    - Debug: False (production mode)
    
    Note: Run Node.js API server first on port 3007
    """
    # Verify frontend file exists before starting
    if not os.path.exists(HTML_FILE):
        print(f"ERROR: {HTML_FILE} not found!")
        exit(1)
    
    # Display startup banner with configuration
    print("\n🚀 NeuraDNS UI Server (Flask)")
    print("=" * 40)
    print(f"📡 UI Server: http://0.0.0.0:8765")
    print(f"🔗 API Backend: {API_BASE_URL}")
    print(f"📄 Serving: {HTML_FILE}")
    print("\nEndpoints:")
    print("  GET  http://0.0.0.0:8765/         - UI")
    print("  GET  http://0.0.0.0:8765/health   - UI Health")
    print("  POST http://0.0.0.0:8765/api/register")
    print("  POST http://0.0.0.0:8765/api/validate")
    print("  GET  http://0.0.0.0:8765/api/resolve")
    print("\n✅ Ready!\n")
    
    # Start server - bind to all interfaces for external access
    app.run(host='0.0.0.0', port=8765, debug=False)
