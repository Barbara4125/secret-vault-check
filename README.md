# 🔐 Secret Vault Check - Employee Satisfaction Survey DApp

> An anonymous employee satisfaction survey platform powered by Fully Homomorphic Encryption (FHE) on Ethereum, ensuring complete privacy of individual responses while enabling transparent aggregate statistics.

## 🎥 Live Demo & Video

- **🌐 Live Demo**: [https://secret-vault-check-q679.vercel.app/](https://secret-vault-check-q679.vercel.app/)
- **📹 Demo Video**: [Watch on GitHub](https://github.com/Barbara4125/secret-vault-check/blob/main/secret-vault-check.mp4)

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Encryption & Decryption Logic](#-encryption--decryption-logic)
- [Smart Contract](#-smart-contract)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [Privacy Guarantees](#-privacy-guarantees)
- [Technology Stack](#-technology-stack)
- [License](#-license)

## 🎯 Overview

Secret Vault Check is a decentralized application (DApp) that enables organizations to collect employee satisfaction data while preserving individual privacy through Fully Homomorphic Encryption (FHE). The system allows employees to submit encrypted ratings that can be aggregated without ever revealing individual responses.

### Key Innovation

Using Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine), computations are performed directly on encrypted data. Individual ratings remain encrypted throughout their lifecycle, while aggregate statistics can be decrypted for organizational insights.

## ✨ Features

- 🔐 **End-to-End Encryption**: Individual survey responses are encrypted using FHE before submission
- 📊 **Encrypted Aggregation**: Smart contract computes totals and counts in encrypted state without decryption
- 🔓 **Selective Decryption**: Only aggregate statistics are decrypted for display, never individual responses
- 🏢 **Department-Based Analytics**: Track satisfaction across Marketing, Sales, Engineering, HR, and Finance
- 🎨 **Modern UI**: Beautiful, responsive interface built with React and TailwindCSS
- 🔗 **Blockchain Integration**: Deployed on Ethereum Sepolia testnet and local Hardhat network
- 🦊 **MetaMask Support**: Seamless wallet integration with RainbowKit

## 🏗️ Architecture

### System Components

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React UI      │─────>│   FHEVM Client   │─────>│  Smart Contract │
│  (Frontend)     │      │  (fhevmjs)       │      │  (Solidity)     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
        │                         │                          │
        │                         │                          │
        v                         v                          v
  User Inputs            Encryption/           Encrypted Aggregation
  Rating (1-10)          Decryption            + Storage
  Department             Logic
```

### Data Flow

1. **Submission Flow**:
   - User selects department and rating (1-10)
   - Frontend encrypts rating using FHEVM client
   - Encrypted data is submitted to smart contract
   - Contract performs homomorphic addition on encrypted values
   - Aggregate totals and counts remain encrypted on-chain

2. **Retrieval Flow**:
   - Frontend requests aggregate statistics
   - Contract returns encrypted handles
   - FHEVM client decrypts aggregates with user's signature
   - Decrypted aggregates are displayed (never individual responses)

## 🔑 Encryption & Decryption Logic

### Frontend Encryption (useFhevm.ts)

The encryption process uses the FHEVM SDK to encrypt user inputs client-side:

```typescript
// Initialize FHEVM instance
const fhevmInstance = await initializeFHEVM(chainId);

// Encrypt rating value (e.g., 1-10)
const encrypted = await fhe.encrypt(
  contractAddress,
  userAddress,
  ratingValue
);

// Encrypted data includes:
// - handleScore: Encrypted rating value
// - handleOne: Encrypted constant '1' for counting
// - inputProof: ZK proof validating the encryption
```

**Key Points**:
- All encryption happens client-side before blockchain submission
- Zero-knowledge proofs ensure validity without revealing plaintext
- Encrypted values are of type `euint32` (encrypted 32-bit unsigned integer)

### Smart Contract Homomorphic Operations

The contract performs operations directly on encrypted data:

```solidity
// Receive encrypted inputs
euint32 score = FHE.fromExternal(encScore, scoreProof);
euint32 one = FHE.fromExternal(encOne, oneProof);

// Homomorphic addition (works on encrypted values!)
_globalTotal = FHE.add(_globalTotal, score);
_globalCount = FHE.add(_globalCount, one);

// Department-specific aggregation
_deptTotal[deptId] = FHE.add(_deptTotal[deptId], score);
_deptCount[deptId] = FHE.add(_deptCount[deptId], one);
```

**Key Points**:
- `FHE.add()` performs addition on encrypted values
- Results remain encrypted throughout computation
- No intermediate decryption occurs
- Individual values are never exposed

### Access Control & Permission System

```solidity
// Grant decryption permissions
FHE.allow(_globalTotal, decryptManager);
FHE.allow(_globalCount, decryptManager);
FHE.allow(_globalTotal, msg.sender);  // Allow submitter to view aggregates
FHE.allow(_globalCount, msg.sender);
```

**Permission Model**:
- Only authorized addresses can decrypt specific encrypted values
- Contract owner (`decryptManager`) can decrypt all aggregates
- Users who submit responses can view aggregates (not individual values)
- Unauthorized decryption attempts are blocked by FHEVM

### Frontend Batch Decryption

Efficient decryption with single signature for multiple values:

```typescript
// Collect encrypted handles from contract
const globalAggResult = await contract.getGlobalAggregates();
const globalTotalHandle = String(globalAggResult[0]);
const globalCountHandle = String(globalAggResult[1]);

// Batch decrypt with ONE signature
const results = await fhe.decryptMultiple(
  [
    { handle: globalTotalHandle, contractAddress },
    { handle: globalCountHandle, contractAddress },
    { handle: deptTotalHandle, contractAddress },
    { handle: deptCountHandle, contractAddress }
  ],
  userAddress
);

// Display decrypted aggregates
const average = results.total / results.count;
```

**Benefits**:
- Single user signature for multiple decryptions
- Improved UX (no multiple wallet popups)
- Efficient gas usage
- Validated through Zama's decryption gateway

## 📦 Smart Contract

### SatisfactionSurvey.sol

Full contract source code:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title SatisfactionSurvey
/// @notice Employee satisfaction survey with encrypted aggregation.
///         Stores only encrypted aggregates (totals and counts), never individual clear data.
///         Only the configured decrypt manager can decrypt aggregates.
contract SatisfactionSurvey is SepoliaConfig {
    /// @notice Address allowed to decrypt aggregate values
    address public immutable decryptManager;

    /// @notice Global encrypted total score and count of responses
    euint32 private _globalTotal;
    euint32 private _globalCount;

    /// @notice Department encrypted totals and counts
    mapping(uint256 => euint32) private _deptTotal;
    mapping(uint256 => euint32) private _deptCount;
    
    /// @notice Track which departments have been initialized
    mapping(uint256 => bool) private _deptInitialized;

    /// @param manager Address authorized to decrypt aggregates
    constructor(address manager) {
        decryptManager = manager;
        
        // Initialize encrypted aggregates to encrypted zero
        _globalTotal = FHE.asEuint32(0);
        _globalCount = FHE.asEuint32(0);
        
        FHE.allowThis(_globalTotal);
        FHE.allowThis(_globalCount);
    }

    /// @notice Submit a response: encrypted score and encrypted constant one (for counting).
    /// @param encScore Encrypted score (e.g., 1..10)
    /// @param scoreProof Input proof for encScore
    /// @param deptId Department identifier
    /// @param encOne Encrypted constant '1' to increment counts
    /// @param oneProof Input proof for encOne
    function submitResponse(
        externalEuint32 encScore,
        bytes calldata scoreProof,
        uint256 deptId,
        externalEuint32 encOne,
        bytes calldata oneProof
    ) external {
        euint32 score = FHE.fromExternal(encScore, scoreProof);
        euint32 one = FHE.fromExternal(encOne, oneProof);

        // Update global aggregates (homomorphic addition)
        _globalTotal = FHE.add(_globalTotal, score);
        _globalCount = FHE.add(_globalCount, one);

        // Initialize department if first submission
        if (!_deptInitialized[deptId]) {
            _deptTotal[deptId] = FHE.asEuint32(0);
            _deptCount[deptId] = FHE.asEuint32(0);
            FHE.allowThis(_deptTotal[deptId]);
            FHE.allowThis(_deptCount[deptId]);
            _deptInitialized[deptId] = true;
        }
        
        // Update department aggregates
        _deptTotal[deptId] = FHE.add(_deptTotal[deptId], score);
        _deptCount[deptId] = FHE.add(_deptCount[deptId], one);

        // Grant decryption permissions
        FHE.allowThis(_globalTotal);
        FHE.allowThis(_globalCount);
        FHE.allowThis(_deptTotal[deptId]);
        FHE.allowThis(_deptCount[deptId]);

        if (decryptManager != address(0)) {
            FHE.allow(_globalTotal, decryptManager);
            FHE.allow(_globalCount, decryptManager);
            FHE.allow(_deptTotal[deptId], decryptManager);
            FHE.allow(_deptCount[deptId], decryptManager);
        }
        
        // Allow submitter to decrypt aggregates
        FHE.allow(_globalTotal, msg.sender);
        FHE.allow(_globalCount, msg.sender);
        FHE.allow(_deptTotal[deptId], msg.sender);
        FHE.allow(_deptCount[deptId], msg.sender);
    }

    /// @notice Get encrypted global total and count
    function getGlobalAggregates() external view returns (euint32 total, euint32 count) {
        return (_globalTotal, _globalCount);
    }

    /// @notice Get encrypted department total and count
    function getDepartmentAggregates(uint256 deptId) external view returns (euint32 total, euint32 count) {
        return (_deptTotal[deptId], _deptCount[deptId]);
    }
    
    /// @notice Allow a user to decrypt global and department aggregates
    function allowUserToDecrypt(address user, uint256[] calldata deptIds) external {
        FHE.allow(_globalTotal, user);
        FHE.allow(_globalCount, user);
        for (uint256 i = 0; i < deptIds.length; i++) {
            if (!_deptInitialized[deptIds[i]]) {
                _deptTotal[deptIds[i]] = FHE.asEuint32(0);
                _deptCount[deptIds[i]] = FHE.asEuint32(0);
                FHE.allowThis(_deptTotal[deptIds[i]]);
                FHE.allowThis(_deptCount[deptIds[i]]);
                _deptInitialized[deptIds[i]] = true;
            }
            FHE.allow(_deptTotal[deptIds[i]], user);
            FHE.allow(_deptCount[deptIds[i]], user);
        }
    }
}
```

### Key Functions

| Function | Description | Access |
|----------|-------------|--------|
| `submitResponse()` | Submit encrypted rating and department | Public |
| `getGlobalAggregates()` | Get encrypted global total and count | View |
| `getDepartmentAggregates()` | Get encrypted department total and count | View |
| `allowUserToDecrypt()` | Grant decryption permission to a user | Public |

### Storage Layout

```solidity
// All values stored encrypted on-chain
euint32 private _globalTotal;     // Σ(all ratings)
euint32 private _globalCount;     // Count of all responses
mapping(uint256 => euint32) private _deptTotal;  // Σ(ratings per dept)
mapping(uint256 => euint32) private _deptCount;  // Count per department
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.x
- npm >= 9.x
- MetaMask browser extension
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Barbara4125/secret-vault-check.git
cd secret-vault-check

# Install dependencies
npm install

# Install UI dependencies
cd ui
npm install
cd ..
```

### Configuration

```bash
# Set up Hardhat variables
npx hardhat vars set MNEMONIC
npx hardhat vars set INFURA_API_KEY
npx hardhat vars set PRIVATE_KEY  # Optional, for Sepolia
```

### Local Development

**Terminal 1 - Start Hardhat Node:**
```bash
npx hardhat node
```

**Terminal 2 - Deploy Contract:**
```bash
npm run deploy:local
```

**Terminal 3 - Start Frontend:**
```bash
cd ui
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Compile Contracts

```bash
npm run compile
```

### Run Tests

```bash
npm run test
```

## 💻 Usage

### Web Interface

1. **Connect Wallet**:
   - Click "Connect Wallet" button
   - Approve MetaMask connection
   - Ensure you're on the correct network (Hardhat Local or Sepolia)

2. **Submit Survey**:
   - Select your department from dropdown
   - Enter rating (1-10)
   - Click "Submit" button
   - Approve MetaMask transaction
   - Wait for confirmation

3. **View Aggregates**:
   - Global aggregates display automatically
   - Department-specific aggregates update in real-time
   - View average scores calculated from encrypted data

### CLI Commands

#### Submit Survey Response
```bash
npx hardhat --network localhost survey:submit --value 8 --dept 0
```

#### View Global Aggregates
```bash
npx hardhat --network localhost survey:get-global
```

#### View Department Aggregates
```bash
npx hardhat --network localhost survey:get-dept --dept 0
```

### Department IDs

| ID | Department |
|----|------------|
| 0  | Marketing |
| 1  | Sales |
| 2  | Engineering |
| 3  | HR |
| 4  | Finance |

## 🌐 Deploy to Sepolia

```bash
# Deploy contract to Sepolia testnet
npm run deploy:sepolia

# Submit a response on Sepolia
npx hardhat --network sepolia survey:submit --value 7 --dept 1

# View global aggregates on Sepolia
npx hardhat --network sepolia survey:get-global
```

**Note**: Ensure you have Sepolia ETH in your wallet. Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/).

## 🔐 Privacy Guarantees

### ✅ Encrypted (Always)

- Individual employee ratings (1-10 scores)
- Individual department selections
- All intermediate computation states
- Raw survey submissions
- Transaction metadata linkage

### ✅ Decrypted (Aggregates Only)

- Global sum of all ratings
- Global count of all responses
- Per-department sum of ratings
- Per-department count of responses
- Computed average scores

### ❌ Never Revealed

- Individual employee ratings
- Employee identities linked to ratings
- Which employee submitted which rating
- Submission timestamps linked to identities
- Any data that could identify individual responses

### Security Properties

1. **Computational Privacy**: Even contract owner cannot decrypt individual ratings
2. **Blockchain Transparency**: All encrypted data is publicly verifiable
3. **Quantum-Resistant**: FHE provides post-quantum security
4. **Trustless Aggregation**: No trusted third party required
5. **Forward Secrecy**: Past responses remain encrypted even if future keys are compromised

## 🛠️ Technology Stack

### Blockchain & Smart Contracts

- **Solidity**: ^0.8.24
- **Hardhat**: Development environment and testing framework
- **FHEVM**: Zama's Fully Homomorphic Encryption Virtual Machine
  - `@fhevm/solidity`: ^0.8.0
  - `@fhevm/hardhat-plugin`: ^0.1.0
- **Ethers.js**: v6.13.0
- **Hardhat Deploy**: Contract deployment management

### Frontend

- **React**: ^18.x (with TypeScript)
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS framework
- **RainbowKit**: Wallet connection UI
- **Wagmi**: React hooks for Ethereum
- **fhevmjs**: ^0.5.0 - Client-side FHE operations

### Encryption

- **FHEVM SDK**: `@zama-fhe/relayer-sdk` (^0.2.0)
- **Oracle**: `@zama-fhe/oracle-solidity` (^0.2.0)
- **Encryption Scheme**: TFHE (Torus Fully Homomorphic Encryption)

### Development Tools

- **TypeScript**: ^5.0.0
- **TypeChain**: ^8.3.0 - TypeScript bindings for contracts
- **Hardhat Network Helpers**: Testing utilities
- **Mocha & Chai**: Testing framework

## 📁 Project Structure

```
secret-vault-check/
├── contracts/
│   └── SatisfactionSurvey.sol       # Main FHE contract
├── deploy/
│   └── 01_deploy_survey.ts          # Deployment script
├── test/
│   └── SatisfactionSurvey.test.ts   # Contract tests
├── ui/
│   ├── src/
│   │   ├── pages/
│   │   │   └── Index.tsx            # Main survey interface
│   │   ├── hooks/
│   │   │   └── useFhevm.ts          # FHE encryption/decryption hook
│   │   ├── abi/
│   │   │   ├── SatisfactionSurveyABI.ts
│   │   │   └── SatisfactionSurveyAddresses.ts
│   │   └── lib/
│   │       └── fhevm.ts             # FHEVM client initialization
│   └── package.json
├── tasks/                            # Hardhat CLI tasks
├── hardhat.config.ts                 # Hardhat configuration
├── package.json
└── README.md
```

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Test coverage includes:
- ✅ Contract deployment and initialization
- ✅ Encrypted response submission
- ✅ Global aggregate computation
- ✅ Department-specific aggregation
- ✅ Access control and permissions
- ✅ Decryption authorization
- ✅ Edge cases and error handling

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Known Issues & Limitations

- FHEVM currently only supports local Hardhat network and Sepolia testnet
- Decryption requires user signature for each unique encrypted value
- Gas costs are higher than traditional contracts due to FHE operations
- Frontend requires MetaMask or compatible Web3 wallet

## 🔮 Future Enhancements

- [ ] Support for additional question types (multiple choice, text)
- [ ] Time-based survey windows
- [ ] Advanced analytics dashboard
- [ ] Role-based access control for viewing aggregates
- [ ] Export functionality for aggregate data
- [ ] Multi-language support
- [ ] Mobile-responsive improvements

## 📚 Resources

- [Zama FHEVM Documentation](https://docs.zama.ai/fhevm)
- [TFHE-rs Library](https://github.com/zama-ai/tfhe-rs)
- [Hardhat Documentation](https://hardhat.org/docs)
- [React Documentation](https://react.dev/)
- [Ethers.js Documentation](https://docs.ethers.org/v6/)

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**.

See [LICENSE](LICENSE) for more information.

## 👥 Authors

- **Barbara4125** - *Initial work* - [GitHub Profile](https://github.com/Barbara4125)

## 🙏 Acknowledgments

- **Zama** - For developing FHEVM and enabling on-chain FHE
- **Ethereum Foundation** - For the Sepolia testnet
- **Hardhat Team** - For excellent development tools
- **OpenZeppelin** - For security best practices

---

**Built with ❤️ using Zama's FHEVM and Ethereum**

**Live Demo**: [https://secret-vault-check-q679.vercel.app/](https://secret-vault-check-q679.vercel.app/)

**Demo Video**: [Watch on GitHub](https://github.com/Barbara4125/secret-vault-check/blob/main/secret-vault-check.mp4)
