# Security Policy

## Overview

SolPacket is a privacy-first Solana-based crypto gifting application. Security is a core feature of this project. This document outlines our security practices, supported versions, and vulnerability reporting procedures.

## Supported Versions

We maintain security updates for the following versions:

| Version | Status | Support End | Notes |
| ------- | ------ | ----------- | ----- |
| 1.2.x   | Active | 2025-12-31  | Current stable release with ZK privacy |
| 1.1.x   | Security Fixes Only | 2025-09-30  | Previous stable release |
| 1.0.x   | End of Life | 2025-06-30  | Legacy version - no longer supported |
| < 1.0   | Unsupported | N/A | Do not use in production |

## Security Features

### Smart Contract Security

- **Non-Custodial Escrow**: Funds held in Program-Derived Accounts (PDAs), never under project custody
- **Zero-Knowledge Proofs**: Transaction amounts hidden using ZK circuits (Token-2022 confidential transfers)
- **Time-Locked Recovery**: Unclaimed gifts automatically recoverable after 24 hours
- **Recipient Validation**: Only designated wallet addresses can claim gifts
- **Immutable Logic**: All escrow operations require sender's wallet signature approval

### Frontend Security

- **Wallet-Only Authentication**: No username/password storage - pure wallet-based access
- **Message Encryption**: Optional encrypted messages between sender and recipient (E2E)
- **No Sensitive Data Logging**: Transaction details never logged to analytics
- **Secure RPC Endpoints**: Helius RPC for reliable devnet/mainnet communication
- **Input Validation**: All user inputs validated before blockchain submission

### Infrastructure Security

- **Supabase Security**: Database access restricted to public read-only for metadata
- **No Private Keys Stored**: All signing happens in user's wallet (Phantom, Solflare)
- **HTTPS Only**: All communication encrypted in transit
- **CORS Protection**: API endpoints properly configured for cross-origin requests
- **Rate Limiting**: (Planned) API rate limiting to prevent abuse

## Known Limitations (Devnet Phase)

We are currently in **Devnet testing phase**. Before mainnet production:

1. **No Third-Party Audit Yet**: Internal security review completed; external audit scheduled pre-mainnet
2. **Token-2022 Privacy Disabled**: Advanced privacy features pending final security validation
3. **Hardcoded Timeouts**: 24-hour expiration currently hardcoded (will be customizable)
4. **Rate Limiting Not Enforced**: API lacks rate limiting (will be implemented)
5. **Analytics Collection**: Minimal analytics enabled for devnet only

## Reporting a Vulnerability

**Please do not create public GitHub issues for security vulnerabilities.**

If you discover a security vulnerability, please report it privately:

### Primary Contact
- **Email**: raikwarnikhil80@gmail.com
- **Subject**: [SECURITY] SolPacket Vulnerability Report
- **Include**:
  - Description of the vulnerability
  - Steps to reproduce
  - Potential impact
  - Suggested fix (if available)

### Telegram (Faster Response)
- **Handle**: @NikhilRaikwar
- **Message**: Request private channel for security discussion

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Initial Assessment**: Within 3 days
- **Fix Implementation**: Within 7-14 days (depending on severity)
- **Public Disclosure**: After fix is deployed and users are protected

## Vulnerability Severity Levels

### Critical (Immediate Fix)
- Loss of funds or private keys
- Wallet signature bypass
- PDA escrow account compromise
- Smart contract exploit allowing theft

**Response Time**: 24-48 hours

### High (Urgent)
- Unauthorized gift claiming
- Recipient privacy breach
- Cross-account transaction forgery
- DoS attacks on core functions

**Response Time**: 3-5 days

### Medium (Standard)
- Privacy information leakage
- UI/UX security issues
- Wallet connection vulnerabilities
- Input validation gaps

**Response Time**: 1-2 weeks

### Low (Backlog)
- Minor privacy concerns
- Documentation gaps
- Best practice recommendations

**Response Time**: As-needed

## Security Best Practices for Users

### Sender Safety

1. **Verify Recipient Address**: Double-check the recipient wallet address before confirming
2. **Test Small Amounts First**: Start with small gift amounts to verify the process
3. **Use Official Wallets**: Only use Phantom or Solflare (as listed on official docs)
4. **Secure Your Wallet**: Protect your seed phrase and private keys
5. **Check Devnet Status**: Verify you're on Solana Devnet before testing

### Recipient Safety

1. **Verify the Sender**: Confirm the gift is from someone you trust
2. **Check Gift Details**: Review the gift amount and message before claiming
3. **One Claim Per Gift**: Each gift can only be claimed once
4. **Within 24 Hours**: Unclaimed gifts expire after 24 hours (funds return to sender)
5. **Trust Your Wallet**: Only approve transactions in your connected wallet

## Security Audit Status

- ✅ **Internal Code Review**: Completed (Dec 2025)
- 🔍 **Smart Contract Audit**: Scheduled for Q1 2026 (pre-mainnet)
- 🛡️ **Penetration Testing**: Planned for mainnet release
- 📋 **Bug Bounty Program**: Will launch 30 days post-mainnet deployment

## Responsible Disclosure

We follow coordinated responsible disclosure:

1. **Private Notification**: Vulnerability reported privately
2. **Fix Development**: We develop and test the fix
3. **User Notification**: We notify users of critical issues
4. **Public Disclosure**: Vulnerability details published after fix deployment
5. **Credit**: With permission, we credit the security researcher

## Future Security Roadmap

### Q1 2026 (Mainnet Launch)
- Third-party smart contract audit
- Rate limiting on all API endpoints
- Advanced privacy with Light Protocol ZK compression
- Multi-signature wallet support

### Q2 2026
- Custom token support with individual audits
- Stealth addresses for enhanced recipient privacy
- Decentralized oracle integration for amounts
- Hardware wallet support

### Q3 2026
- Formal verification of smart contracts
- Automated security testing (CI/CD)
- Community-run security node infrastructure
- Bug bounty platform integration

## PDA Escrow Security

### Account Derivation
```
PDA Seed: ["gift_escrow", creator_pubkey, recipient_pubkey, gift_id]
Program: AiebTbnydag8QCPFhapiuPzd5hy8MvKNXeVVYR2dZ94Z
Authority: Program itself (non-custodial)
```

### Claim Validation
- ✓ Recipient wallet matches escrow recipient
- ✓ Gift not already claimed
- ✓ Gift not expired (24h window)
- ✓ Recipient signs the claim transaction

## Privacy Guarantees

### Sender Privacy
- ❌ **Sender address is public** on blockchain (required for fund recovery)
- ✅ No personal information beyond wallet address stored
- ✅ No geographic or device tracking

### Recipient Privacy
- ✅ **No public link** between sender and recipient
- ✅ Gift amount hidden via ZK proofs (Token-2022)
- ✅ Optional encrypted message (E2E encryption)
- ✅ No analytics on recipient identity

### Transaction Privacy
- ✅ Amounts use confidential transfer proofs
- ✅ No metadata tags beyond gift_escrow
- ✅ Zero correlation between gift creation and claiming

## Compliance

### Regulatory Considerations

- **US State Restrictions**: Currently devnet only; will document AML/KYC requirements at mainnet
- **International**: No geographic restrictions on devnet
- **Export Controls**: No US export control violations (open-source)

### Data Retention

- **Gift Metadata**: Stored in Supabase; deleted 30 days after claim or expiration
- **Transaction History**: Stored on Solana blockchain (permanent/immutable)
- **User Analytics**: Not collected during devnet phase

## Contact & Support

**For Security Issues**: raikwarnikhil80@gmail.com (mark subject line: [SECURITY])

**For General Questions**: GitHub Issues (public)

**For Fast Response**: @NikhilRaikwar on Telegram

---

**Last Updated**: December 28, 2025
**Document Version**: 1.2
**Status**: Active (Devnet Phase)
