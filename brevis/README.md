# MoonFi Platform

A blockchain-based platform designed specifically for Muslims to fulfill religious financial obligations through Shariah-compliant mechanisms. MuslimGo leverages zero-knowledge proofs via Brevis to enable secure, transparent, and interest-free financial services for Zakat payment and Hajj savings.

## Core Components

### 1. Zakat Management System
- Automated calculation of the 2.5% obligation based on verifiable asset holdings
- Transparent distribution to approved charitable organizations
- Complete audit trail of donations while maintaining donor privacy
- Basic service available to all users

### 2. Hajj Preparation Program
- Premium tier feature with enhanced services
- Zero-knowledge proof verification for premium user status
- Shariah-compliant fund management for Hajj savings
- Smart-contract managed funds with programmatic release upon goal achievement

### Verified Contract
Hajj contract
https://sepolia.etherscan.io/address/0x0e2aebe3e835d93dfb8bf3cf69a41c88f10368e7

Zakat contract
https://sepolia.etherscan.io/address/0xe41279a05f3eec58acdb7df13de3148db912dfd5

## Technical Architecture

The platform consists of three main components:

### Smart Contracts
- `MuslimGoZakat.sol`: Handles verification of assets, calculation of Zakat (2.5%), and distribution to charities
- `MuslimGoHajj.sol`: Manages premium user verification, savings accounts with goals, and fund tracking

### Zero-Knowledge Proof Infrastructure
- **Zakat Prover**: Verifies user assets without exposing actual values
- **Premium Prover**: Confirms premium status for Hajj services

### Application Layer
- Node.js application for generating proofs and interacting with Brevis backend
- Integration with blockchain for smart contract interactions

## Getting Started

### Prerequisites
- Node.js LTS (v16+)
- Go 1.20+
- Windows or Linux OS

### Installation

#### 1. Clone Repository
```bash
git clone https://github.com/your-repo/muslimgo.git
cd muslimgo
```

#### 2. Set Up Provers

**For Windows:**
```powershell
# Create required directories
mkdir -Force "$env:USERPROFILE\circuitOut\zakat"
mkdir -Force "$env:USERPROFILE\circuitOut\premium"
mkdir -Force "$env:USERPROFILE\kzgsrs"

# Download SRS file
$url = "https://kzg-srs.s3.us-west-2.amazonaws.com/kzg_srs_100800000_bn254_MAIN_IGNITION"
$output = "$env:USERPROFILE\kzgsrs\kzg_srs_100800000_bn254_MAIN_IGNITION"
Invoke-WebRequest -Uri $url -OutFile $output

# Build the provers
cd brevis/prover
go build -o "$env:USERPROFILE\go\bin\zakat_prover.exe" ./cmd/zakat_prover.go
go build -o "$env:USERPROFILE\go\bin\premium_prover.exe" ./cmd/premium_prover.go
```

**For Linux:**
```bash
cd brevis/prover
make install
make config
make deploy
```

#### 3. Set Up Contracts
```bash
cd brevis/contracts
npm install
```

#### 4. Set Up Application
```bash
cd brevis/app
npm install
```

### Running the Platform

#### 1. Start Provers

**For Windows:**
```powershell
# In first PowerShell window
& "$env:USERPROFILE\go\bin\zakat_prover.exe" -port=33247

# In second PowerShell window
& "$env:USERPROFILE\go\bin\premium_prover.exe" -port=33248
```

**For Linux:**
```bash
# Start provers in background
make start
```

#### 2. Run Tests
```bash
cd brevis/app
npx ts-node src/test-zakat.ts
npx ts-node src/test-premium.ts
```

#### 3. Deploy Contracts (to Sepolia testnet)
```bash
cd brevis/contracts
npx hardhat deploy --network sepolia --tags MuslimGoZakat
npx hardhat deploy --network sepolia --tags MuslimGoHajj
```

## Islamic Finance Compliance Features

The MuslimGo platform implements several design choices specifically aligned with Islamic financial principles:

1. **Interest-Free Design**: No riba (interest) mechanisms in the savings accounts
2. **Asset Verification**: Ensures accurate Zakat calculation without exposing financial details
3. **Transparent Distribution**: Clear tracking of charitable distributions
4. **Goal-Based Savings**: Focus on purpose-driven financial planning for Hajj

## Technical Features

- **Privacy with Accountability**: Zero-knowledge proofs allow for verification without revealing sensitive data
- **Scalable Architecture**: Separate prover services for different functions allow independent scaling
- **Security-Focused**: Uses OpenZeppelin contracts and proper access controls
- **Well-Structured Code**: Clean separation of concerns in both contracts and prover logic

## File Structure

```
brevis/
├── app/                  # Application code
│   ├── src/              # Source code
│   │   ├── index.ts      # Main application
│   │   └── test-*.ts     # Test scripts
├── contracts/            # Smart contracts
│   ├── contracts/        # Contract source code
│   │   ├── MuslimGoZakat.sol
│   │   ├── MuslimGoHajj.sol
│   │   └── lib/          # Contract libraries
├── prover/               # Prover service
│   ├── circuits/         # ZK circuit definitions
│   │   ├── zakat_circuit.go
│   │   └── premium_circuit.go
│   ├── cmd/              # Command-line tools
│   │   ├── zakat_prover.go
│   │   └── premium_prover.go
│   └── configs/          # Service configurations
```

## Development Roadmap

1. **MVP Release** - Core Zakat and Hajj functionality with basic UI
2. **Beta Release** - Enhanced features, improved UI, and community testing
3. **Public Launch** - Full platform with additional Shariah-compliant products

## License

[MIT License](LICENSE)