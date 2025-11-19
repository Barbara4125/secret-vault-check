# Secret Vault Check - Employee Satisfaction Survey

A fully homomorphic encryption (FHE) powered anonymous employee satisfaction survey built on Ethereum. This project demonstrates the practical application of FHE in privacy-preserving data collection and aggregation.

## Features

- **Anonymous Submissions**: Employee ratings are encrypted using FHE, ensuring individual responses remain private
- **Real-time Aggregation**: View decrypted global and department-level statistics without revealing individual data
- **Department-based Analysis**: Separate aggregates for Marketing, Sales, Engineering, HR, and Finance departments
- **Multi-network Support**: Works on local Hardhat network and Sepolia testnet
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS

## Architecture

### Smart Contract (`SatisfactionSurvey.sol`)
- Built with Solidity ^0.8.24
- Uses Zama's FHE library for homomorphic encryption
- Stores only encrypted aggregates, never individual clear data
- Implements lazy initialization for gas efficiency
- Supports permission-based decryption for authorized users

### Frontend (React + TypeScript)
- Wallet connection via RainbowKit
- Real-time decryption of aggregate statistics
- Responsive design with modern UI components
- Type-safe development with full TypeScript support

## Prerequisites

- Node.js 18+
- npm or yarn
- Git

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Barbara4125/secret-vault-check.git
cd secret-vault-check
```

2. Install dependencies:
```bash
npm install
```

3. Install UI dependencies:
```bash
cd ui && npm install
```

## Development Setup

### Local Development

1. Start Hardhat node:
```bash
npx hardhat node
```

2. Deploy contract:
```bash
npx hardhat run scripts/deploy.ts --network localhost
```

3. Start UI development server:
```bash
cd ui && npm run dev
```

4. Open http://localhost:5173 in your browser

### Testnet Deployment

1. Configure your Sepolia RPC URL in `hardhat.config.ts`
2. Add your private key to environment variables
3. Deploy to Sepolia:
```bash
npx hardhat run scripts/deploy.ts --network sepolia
```

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Select your department from the dropdown
3. Enter a rating from 1-10
4. Click "Submit" to send your encrypted response
5. View real-time aggregate statistics for global and department levels

## Technical Details

### Encryption Flow
1. User input is encrypted client-side using FHE
2. Encrypted values are submitted to the smart contract
3. Contract performs homomorphic addition on encrypted aggregates
4. Authorized users can decrypt aggregate statistics
5. Individual responses remain mathematically private

### Gas Optimizations
- Lazy initialization of department aggregates
- Batched FHE permission calls
- Optimized storage patterns for encrypted data

### Security Considerations
- All individual data remains encrypted
- Only authorized decrypt manager can access decryption keys
- Client-side encryption ensures data privacy from submission
- Permission-based access control for decryption

## Testing

Run the test suite:
```bash
npx hardhat test
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

## Contributing

This project was developed collaboratively by:
- **Barbara4125** (Contract Development)
- **Kirk225** (UI Development)

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Zama](https://www.zama.ai/) for the FHE library
- [Hardhat](https://hardhat.org/) for Ethereum development tools
- [Wagmi](https://wagmi.sh/) and [RainbowKit](https://rainbowkit.com/) for wallet integration
- [Tailwind CSS](https://tailwindcss.com/) for styling
