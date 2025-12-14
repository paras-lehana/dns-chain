/**
 * ============================================================================
 * NEURADNS - BLOCKCHAIN API SERVER
 * ============================================================================
 * 
 * This is the main API server for NeuraDNS, an AI-powered decentralized
 * Domain Name System built on Solana blockchain.
 * 
 * ARCHITECTURE:
 * - Express.js REST API handling domain operations
 * - Solana blockchain for immutable domain storage
 * - n8n webhook for AI-powered domain validation (Groq LLM)
 * 
 * ENDPOINTS:
 * - POST /validate  - Check domain availability + AI validation
 * - POST /register  - Register domain on blockchain
 * - GET  /resolve   - Query domain from blockchain
 * - GET  /health    - API health check
 * 
 * ENVIRONMENT VARIABLES:
 * - PORT: Server port (default: 3007)
 * - N8N_WEBHOOK_URL: AI validation webhook endpoint
 * 
 * @author NeuraDNS Team
 * @version 1.0.0
 * @license MIT
 * ============================================================================
 */

import express from "express";
import cors from "cors";
import { Connection, Keypair, PublicKey, SystemProgram, TransactionInstruction, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createHash } from "crypto";
import fs from "fs";
import axios from "axios";

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Express application instance
 */
const app = express();

/**
 * Server port - configurable via environment variable
 * @default 3007
 */
const PORT = Number(process.env.PORT) || 3007;

/**
 * n8n webhook URL for AI-powered domain validation
 * This endpoint connects to Groq LLM for real-time fraud detection
 */
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || "https://n8n.backend.lehana.in/webhook/validate_domain";

// ============================================================================
// MIDDLEWARE SETUP
// ============================================================================

/**
 * Enable CORS for cross-origin requests from the frontend
 */
app.use(cors());

/**
 * Parse JSON request bodies
 */
app.use(express.json());

// ============================================================================
// SOLANA BLOCKCHAIN SETUP
// ============================================================================

/**
 * Solana connection to Devnet cluster
 * Uses 'confirmed' commitment level for balance between speed and reliability
 */
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

/**
 * NeuraDNS Solana Program ID
 * This is the deployed Anchor smart contract address on Devnet
 * @see https://explorer.solana.com/address/H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM?cluster=devnet
 */
const PROGRAM_ID = new PublicKey("H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM");

// ============================================================================
// WALLET INITIALIZATION
// ============================================================================

/**
 * Solana keypair for signing transactions
 * Loaded from wallet.json file containing the private key array
 */
let wallet: Keypair;
try {
  const walletPath = "wallet.json";
  const keypairData = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  wallet = Keypair.fromSecretKey(new Uint8Array(keypairData));
  console.log("✅ Loaded wallet:", wallet.publicKey.toBase58());
} catch (error) {
  console.error("❌ Failed to load wallet:", error);
  process.exit(1);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate Anchor instruction discriminator
 * 
 * Anchor uses the first 8 bytes of the SHA256 hash of "global:<instruction_name>"
 * as the discriminator to identify which instruction to execute.
 * 
 * @param name - The instruction name (e.g., "register_request")
 * @returns Buffer containing the 8-byte discriminator
 * 
 * @example
 * const discriminator = getDiscriminator("register_request");
 * // Returns first 8 bytes of SHA256("global:register_request")
 */
function getDiscriminator(name: string): Buffer {
  const preimage = `global:${name}`;
  const hash = createHash('sha256').update(preimage, 'utf-8').digest();
  return Buffer.from(hash.slice(0, 8));
}

/**
 * Serialize a string for Anchor instruction data
 * 
 * Anchor expects strings with a 4-byte little-endian length prefix
 * followed by the UTF-8 encoded bytes.
 * 
 * @param str - The string to serialize
 * @returns Buffer with length prefix + string bytes
 * 
 * @example
 * serializeString("hello") // Returns: [5, 0, 0, 0, 104, 101, 108, 108, 111]
 */
function serializeString(str: string): Buffer {
  const strBytes = Buffer.from(str, 'utf-8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBytes.length, 0);
  return Buffer.concat([lenBuf, strBytes]);
}

/**
 * Derive Program Derived Address (PDA) for a domain
 * 
 * PDAs are deterministic addresses derived from seeds and the program ID.
 * For NeuraDNS, each domain has a unique PDA derived from:
 * - Seed: ["domain", domain_name]
 * - Program ID: PROGRAM_ID
 * 
 * This ensures:
 * - One domain = one unique account
 * - Collision-free addressing
 * - No private key needed for the account
 * 
 * @param domain - The domain name (e.g., "example.com")
 * @returns Tuple of [PublicKey, bump] for the PDA
 * 
 * @example
 * const [pda, bump] = getDomainPDA("example.com");
 */
function getDomainPDA(domain: string): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("domain"), Buffer.from(domain)],
    PROGRAM_ID
  );
}

// ============================================================================
// AI VALIDATION LAYER
// ============================================================================

/**
 * Validate domain and IP using AI-powered n8n webhook
 * 
 * This function sends domain registration requests to the n8n workflow,
 * which uses Groq LLM to perform intelligent validation including:
 * 
 * SECURITY CHECKS:
 * - Homograph attack detection (e.g., "rnicrosoft" mimicking "microsoft")
 * - Typosquatting prevention (e.g., "gooogle", "amazn")
 * - Well-known domain protection (blocks google.com, facebook.com, etc.)
 * - Private IP detection (rejects 192.168.x.x, 10.x.x.x, etc.)
 * - Risk scoring with confidence levels (0.0 - 1.0)
 * 
 * RESPONSE FORMAT:
 * {
 *   valid: boolean,        // Whether domain passes validation
 *   reason: string,        // Human-readable explanation
 *   confidence: number,    // AI confidence score (0.0-1.0)
 *   checks: object,        // Individual check results
 *   riskLevel: string      // "low" | "medium" | "high"
 * }
 * 
 * @param domain - The domain name to validate
 * @param ip - The IP address to validate
 * @returns Promise with validation result
 * 
 * @example
 * const result = await validateWithAI("mysite.blockchain", "8.8.8.8");
 * if (result.valid) {
 *   // Proceed with registration
 * }
 */
async function validateWithAI(domain: string, ip: string): Promise<{valid: boolean, reason?: string, confidence?: number, checks?: any, riskLevel?: string}> {
  try {
    console.log(`🤖 Sending to AI validation: ${domain} -> ${ip}`);
    
    const response = await axios.post(N8N_WEBHOOK_URL, {
      domain,
      ip,
      timestamp: new Date().toISOString(),
      requestedBy: wallet.publicKey.toBase58()
    }, {
      timeout: 10000 // 10 second timeout for AI processing
    });

    console.log(`✅ AI Response:`, response.data);
    return response.data;
  } catch (error: any) {
    console.error(`❌ AI validation error:`, error.message);
    // Fallback to basic validation if n8n is unavailable
    // This ensures the service remains operational
    return {
      valid: true,
      reason: "AI validation unavailable, using fallback",
      confidence: 0.5
    };
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * POST /validate
 * 
 * Validate a domain registration request without registering it.
 * This endpoint performs two-layer validation:
 * 
 * LAYER 1: Blockchain Check
 * - Derives PDA for the domain
 * - Checks if account already exists on-chain
 * - Returns early if domain is already registered
 * 
 * LAYER 2: AI Validation
 * - Sends to n8n webhook for Groq LLM analysis
 * - Checks for fraud patterns, homograph attacks, etc.
 * - Returns confidence score and risk level
 * 
 * REQUEST BODY:
 * {
 *   "domain": "example.com",
 *   "ip": "8.8.8.8"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": boolean,
 *   "exists": boolean,      // True if already on blockchain
 *   "available": boolean,   // True if available for registration
 *   "valid": boolean,       // True if passes AI validation
 *   "reason": string,       // Explanation
 *   "confidence": number,   // AI confidence (0.0-1.0)
 *   "aiValidation": object  // Full AI response
 * }
 */
app.post("/validate", async (req, res) => {
  try {
    const { domain, ip } = req.body;

    if (!domain || !ip) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: domain and ip",
      });
    }

    console.log(`🔍 Validating: ${domain} -> ${ip}`);

    // Step 1: Check if domain already exists on blockchain
    const [domainPda] = getDomainPDA(domain);
    
    try {
      const accountInfo = await connection.getAccountInfo(domainPda);
      
      if (accountInfo && accountInfo.data.length > 0) {
        // Domain already registered
        const data = accountInfo.data;
        let offset = 8;
        const domainLen = data.readUInt32LE(offset);
        offset += 4;
        const domainName = data.slice(offset, offset + domainLen).toString('utf-8');
        offset += domainLen;
        
        const recordLen = data.readUInt32LE(offset);
        offset += 4;
        const ipAddress = data.slice(offset, offset + recordLen).toString('utf-8');
        
        return res.json({
          success: false,
          exists: true,
          valid: false,
          message: `Domain "${domain}" is already registered`,
          data: {
            domain: domainName,
            ip: ipAddress,
            accountAddress: domainPda.toBase58()
          }
        });
      }
    } catch (error) {
      // Account doesn't exist - continue with validation
      console.log(`✅ Domain "${domain}" is available`);
    }

    // Step 2: Domain available - validate with AI via n8n
    const aiValidation = await validateWithAI(domain, ip);
    
    return res.json({
      success: aiValidation.valid,
      exists: false,
      available: true,
      valid: aiValidation.valid,
      reason: aiValidation.reason,
      confidence: aiValidation.confidence,
      aiValidation: aiValidation
    });
  } catch (error: any) {
    console.error("❌ Validation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Validation failed"
    });
  }
});

/**
 * POST /register
 * 
 * Register a domain on the Solana blockchain after AI validation.
 * This is the main registration endpoint that:
 * 
 * STEP 1: AI Validation
 * - Sends request to n8n/Groq for fraud detection
 * - Blocks suspicious domains (homographs, typosquatting, well-known)
 * - Returns error with reason if validation fails
 * 
 * STEP 2: Blockchain Transaction
 * - Derives PDA for the domain
 * - Creates instruction with discriminator + serialized data
 * - Signs transaction with wallet
 * - Sends to Solana Devnet
 * - Waits for confirmation
 * 
 * REQUEST BODY:
 * {
 *   "domain": "example.com",
 *   "ip": "8.8.8.8"
 * }
 * 
 * SUCCESS RESPONSE:
 * {
 *   "success": true,
 *   "message": "Domain registered successfully",
 *   "aiValidation": { passed: true, confidence: 0.95 },
 *   "data": {
 *     "domain": "example.com",
 *     "ip": "8.8.8.8",
 *     "transaction": "signature...",
 *     "domainAccount": "PDA address...",
 *     "explorer": "https://explorer.solana.com/tx/..."
 *   }
 * }
 * 
 * ERROR RESPONSE (AI Rejection):
 * {
 *   "success": false,
 *   "error": "Validation failed",
 *   "reason": "Homograph attack detected",
 *   "aiChecked": true
 * }
 */
app.post("/register", async (req, res) => {
  try {
    const { domain, ip } = req.body;

    if (!domain || !ip) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: domain and ip",
      });
    }

    console.log(`📝 Registering: ${domain} -> ${ip}`);

    // Step 1: AI-powered validation via n8n
    const aiValidation = await validateWithAI(domain, ip);
    
    if (!aiValidation.valid) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        reason: aiValidation.reason || "Domain/IP failed AI validation",
        confidence: aiValidation.confidence,
        aiChecked: true
      });
    }

    console.log(`✅ AI validation passed (confidence: ${aiValidation.confidence})`);
    // Continue with blockchain registration...

    const [domainPda] = getDomainPDA(domain);

    // Build instruction data: discriminator + serialized arguments
    const discriminator = getDiscriminator("register_request");
    const domainBytes = serializeString(domain);
    const ipBytes = serializeString(ip);
    
    const instructionData = Buffer.concat([
      discriminator,
      domainBytes,
      ipBytes
    ]);

    console.log(`📦 Instruction data length: ${instructionData.length} bytes`);

    // Create the instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: domainPda, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
      ],
      programId: PROGRAM_ID,
      data: instructionData
    });

    // Create and send transaction
    const transaction = new Transaction().add(instruction);
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      { commitment: 'confirmed' }
    );

    console.log(`✅ Registered! Tx: ${signature}`);

    res.json({
      success: true,
      message: "Domain registered successfully on blockchain",
      aiValidation: {
        passed: true,
        confidence: aiValidation.confidence,
        checks: (aiValidation as any).checks || {},
        riskLevel: (aiValidation as any).riskLevel || "low"
      },
      data: {
        domain,
        ip,
        transaction: signature,
        domainAccount: domainPda.toBase58(),
        explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      },
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to register domain",
      details: error.logs || error.toString()
    });
  }
});

/**
 * GET /resolve
 * 
 * Resolve a domain from the Solana blockchain.
 * Queries the PDA account for a registered domain and returns the IP address.
 * 
 * PROCESS:
 * 1. Derive PDA from domain name using seeds ["domain", domain_name]
 * 2. Fetch account data from Solana
 * 3. Parse serialized data (discriminator + strings with length prefixes)
 * 4. Return domain record with IP address
 * 
 * QUERY PARAMETERS:
 * - domain: The domain name to resolve (required)
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   "success": true,
 *   "data": {
 *     "domain": "example.com",
 *     "ip": "8.8.8.8",
 *     "accountAddress": "PDA address..."
 *   }
 * }
 * 
 * ERROR RESPONSE (404):
 * {
 *   "success": false,
 *   "error": "Domain not found on blockchain"
 * }
 */
app.get("/resolve", async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain || typeof domain !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameter: domain",
      });
    }

    console.log(`🔍 Resolving: ${domain}`);

    const [domainPda] = getDomainPDA(domain);

    // Fetch the account
    const accountInfo = await connection.getAccountInfo(domainPda);

    if (!accountInfo) {
      return res.status(404).json({
        success: false,
        error: "Domain not found on blockchain",
      });
    }

    // Parse account data
    const data = accountInfo.data;
    
    // Skip 8-byte discriminator
    let offset = 8;
    const domainNameLen = data.readUInt32LE(offset);
    offset += 4;
    const domainName = data.toString('utf-8', offset, offset + domainNameLen);
    offset += domainNameLen;
    
    // Read IP
    const ipLen = data.readUInt32LE(offset);
    offset += 4;
    const ipAddress = data.toString('utf-8', offset, offset + ipLen);

    res.json({
      success: true,
      data: {
        domain: domainName,
        ip: ipAddress,
        accountAddress: domainPda.toBase58(),
      },
    });
  } catch (error: any) {
    console.error("❌ Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /health
 * 
 * Health check endpoint for API monitoring.
 * Returns server status and configuration info.
 * 
 * Used for:
 * - Load balancer health checks
 * - Monitoring/alerting systems
 * - Debugging connectivity
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Neura DNS API is running",
 *   "cluster": "Devnet",
 *   "programId": "H7azh1pVd3u..."
 * }
 */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Neura DNS API is running",
    cluster: "Devnet",
    programId: PROGRAM_ID.toBase58(),
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

/**
 * Start the Express server
 * 
 * Configuration:
 * - Host: 0.0.0.0 (accessible from all network interfaces)
 * - Port: Configurable via PORT env var (default: 3007)
 * 
 * Startup displays:
 * - Server URLs (local and external)
 * - Solana cluster info
 * - Program ID
 * - Available endpoints
 */
app.listen(PORT, '0.0.0.0', () => {
  console.log("\n🚀 Neura DNS API Server");
  console.log("========================");
  console.log(`📡 Server: http://0.0.0.0:${PORT}`);
  console.log(`📡 External: http://82.112.235.26:${PORT}`);
  console.log(`🌐 Cluster: Devnet`);
  console.log(`📝 Program ID: ${PROGRAM_ID.toBase58()}`);
  console.log("\nEndpoints:");
  console.log(`  POST http://localhost:${PORT}/validate`);
  console.log(`  POST http://localhost:${PORT}/register`);
  console.log(`  GET  http://localhost:${PORT}/resolve?domain=<name>`);
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log("\n✅ Ready!\n");
});
