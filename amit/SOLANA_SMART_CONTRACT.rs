// ============================================================================
// NEURA DNS - Solana Smart Contract
// ============================================================================
// Deployed Program ID: H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM
// Network: Solana Devnet
// Framework: Anchor 0.32.1
// ============================================================================

use anchor_lang::prelude::*;

// This will be auto-generated when you deploy
declare_id!("H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM");

#[program]
pub mod neura_dns {
    use super::*;

    /// Register a domain name with an IP/record
    /// Validates format and stores on-chain
    /// 
    /// # Arguments
    /// * `domain_name` - The domain name to register (e.g., "example.com")
    /// * `record` - The IP address or record value (e.g., "8.8.8.8")
    /// 
    /// # Process
    /// 1. Logs registration request details
    /// 2. Validates domain and IP format
    /// 3. Creates PDA (Program Derived Address) account
    /// 4. Stores domain record on-chain with metadata
    /// 
    /// # Storage
    /// - Uses PDA with seeds: ["domain", domain_name.as_bytes()]
    /// - Stores: domain_name, record (IP), authority (wallet), timestamp
    /// 
    /// # Errors
    /// - InvalidDomain: Domain format validation failed
    /// - InvalidIp: IP address format validation failed
    pub fn register_request(
        ctx: Context<RegisterDomain>,
        domain_name: String,
        record: String,
    ) -> Result<()> {
        msg!("🌐 NEURA DNS - Domain Registration Request");
        msg!("Domain: {}", domain_name);
        msg!("Record: {}", record);
        msg!("Authority: {}", ctx.accounts.authority.key());

        // Validate domain and IP format
        validate_domain_and_ip(&domain_name, &record)?;

        // Store domain record on-chain
        let domain_account = &mut ctx.accounts.domain_account;
        domain_account.domain_name = domain_name;
        domain_account.record = record;
        domain_account.authority = ctx.accounts.authority.key();
        domain_account.created_at = Clock::get()?.unix_timestamp;

        msg!("✅ Registration successful - stored on-chain");
        Ok(())
    }

    /// Resolve a domain - reads from on-chain storage
    /// 
    /// # Arguments
    /// * `_domain_name` - The domain name to resolve (used for PDA derivation)
    /// 
    /// # Process
    /// 1. Fetches domain account using PDA
    /// 2. Logs domain information
    /// 3. Returns domain record data
    /// 
    /// # Returns
    /// - Domain name
    /// - IP address/record
    /// - Registrar's wallet address
    /// - Creation timestamp
    /// 
    /// # Notes
    /// - Requires valid PDA account to exist
    /// - Read-only operation, no state modification
    pub fn resolve_domain(
        ctx: Context<ResolveDomain>,
        _domain_name: String,
    ) -> Result<()> {
        let domain_account = &ctx.accounts.domain_account;
        
        msg!("🔍 NEURA DNS - Domain Resolution Request");
        msg!("Looking up: {}", domain_account.domain_name);
        msg!("✅ Resolved to: {}", domain_account.record);
        msg!("Registered by: {}", domain_account.authority);
        msg!("Created at: {}", domain_account.created_at);
        
        Ok(())
    }
}

/// Validator function - checks domain and IP format
/// 
/// # Arguments
/// * `domain` - Domain name string to validate
/// * `ip` - IP address string to validate
/// 
/// # Domain Validation Rules
/// - Not empty
/// - Max 256 characters
/// - Must contain at least one dot (.)
/// - Cannot start or end with dot
/// 
/// # IP Validation Rules (IPv4)
/// - Not empty
/// - Max 15 characters
/// - Must have exactly 4 octets (separated by dots)
/// - Each octet must be 0-255
/// 
/// # Errors
/// - DnsError::InvalidDomain: Domain doesn't meet format requirements
/// - DnsError::InvalidIp: IP doesn't meet format requirements
fn validate_domain_and_ip(domain: &str, ip: &str) -> Result<()> {
    // Domain validation
    require!(
        !domain.is_empty() && domain.len() <= 256,
        DnsError::InvalidDomain
    );
    require!(
        domain.contains('.') && !domain.starts_with('.') && !domain.ends_with('.'),
        DnsError::InvalidDomain
    );

    // IP validation (simple IPv4 check)
    require!(
        !ip.is_empty() && ip.len() <= 15,
        DnsError::InvalidIp
    );
    let parts: Vec<&str> = ip.split('.').collect();
    require!(parts.len() == 4, DnsError::InvalidIp);
    
    for part in parts {
        let num: Result<u8, _> = part.parse();
        require!(num.is_ok(), DnsError::InvalidIp);
    }

    Ok(())
}

/// Account context for domain registration
/// 
/// # Accounts
/// * `domain_account` - PDA account to store domain data (init, mutable)
/// * `authority` - Wallet signing the transaction (signer, mutable for rent)
/// * `system_program` - Solana system program for account creation
/// 
/// # PDA Derivation
/// - Seeds: [b"domain", domain_name.as_bytes()]
/// - Deterministic address based on domain name
/// - Collision-free, one domain per PDA
/// 
/// # Storage
/// - Space: 8 bytes (discriminator) + DomainRecord::INIT_SPACE
/// - Payer: authority (transaction signer)
/// - Rent: Exempt (automatically calculated)
#[derive(Accounts)]
#[instruction(domain_name: String)]
pub struct RegisterDomain<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + DomainRecord::INIT_SPACE,
        seeds = [b"domain", domain_name.as_bytes()],
        bump
    )]
    pub domain_account: Account<'info, DomainRecord>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

/// Account context for domain resolution
/// 
/// # Accounts
/// * `domain_account` - PDA account containing domain data (read-only)
/// * `authority` - Wallet querying the domain (signer)
/// 
/// # PDA Derivation
/// - Same seeds as registration: [b"domain", domain_name.as_bytes()]
/// - Account must exist (created during registration)
/// 
/// # Notes
/// - Read-only operation
/// - No state modification
/// - No rent fees
#[derive(Accounts)]
#[instruction(domain_name: String)]
pub struct ResolveDomain<'info> {
    #[account(
        seeds = [b"domain", domain_name.as_bytes()],
        bump
    )]
    pub domain_account: Account<'info, DomainRecord>,
    
    pub authority: Signer<'info>,
}

/// Domain record data structure
/// 
/// # Fields
/// * `domain_name` - The registered domain name (max 256 chars)
/// * `record` - IP address or record value (max 15 chars for IPv4)
/// * `authority` - Public key of the registrar (wallet address)
/// * `created_at` - Unix timestamp of registration
/// 
/// # Storage Size
/// - domain_name: 4 bytes (length) + 256 bytes (max string)
/// - record: 4 bytes (length) + 15 bytes (max string)
/// - authority: 32 bytes (Pubkey)
/// - created_at: 8 bytes (i64)
/// - Total: ~319 bytes + 8 byte discriminator
/// 
/// # Notes
/// - Immutable once created (no update function)
/// - Deterministically addressable via PDA
/// - Rent-exempt storage
#[account]
#[derive(InitSpace)]
pub struct DomainRecord {
    #[max_len(256)]
    pub domain_name: String,
    #[max_len(15)]
    pub record: String,
    pub authority: Pubkey,
    pub created_at: i64,
}

/// Custom error codes for DNS operations
/// 
/// # Errors
/// * `InvalidDomain` - Domain format validation failed
///   - Empty domain
///   - Too long (>256 chars)
///   - Missing dots
///   - Starts/ends with dot
/// 
/// * `InvalidIp` - IP address validation failed
///   - Empty IP
///   - Too long (>15 chars)
///   - Not 4 octets
///   - Octets not 0-255
#[error_code]
pub enum DnsError {
    #[msg("Invalid domain format")]
    InvalidDomain,
    #[msg("Invalid IP address format")]
    InvalidIp,
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================
//
// 1. REGISTER DOMAIN
// -------------------
// Instruction: register_request
// Args: 
//   - domain_name: "example.com"
//   - record: "8.8.8.8"
// Accounts:
//   - domain_account: PDA ["domain", "example.com"]
//   - authority: Your wallet (signer)
//   - system_program: System Program
//
// Result: Creates PDA account with domain data
//
// 2. RESOLVE DOMAIN
// -----------------
// Instruction: resolve_domain
// Args:
//   - domain_name: "example.com"
// Accounts:
//   - domain_account: PDA ["domain", "example.com"]
//   - authority: Any wallet (signer)
//
// Result: Returns domain record from on-chain storage
//
// ============================================================================
// DEPLOYMENT INFORMATION
// ============================================================================
//
// Deploy Command:
//   anchor build
//   anchor deploy --provider.cluster devnet
//
// Deployed Address: H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM
// Network: Devnet
// Cluster URL: https://api.devnet.solana.com
// Explorer: https://explorer.solana.com/address/H7azh1pVd3uySy7z4JRmQL2HpF2D9673Y9RP4yXZWfFM?cluster=devnet
//
// ============================================================================
