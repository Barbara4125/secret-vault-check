import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTRACT_NAME = 'SatisfactionSurvey';
const DEPLOYMENTS_DIR = path.resolve(__dirname, '../../deployments');
const OUTPUT_DIR = path.resolve(__dirname, '../src/abi');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read ABI from compiled artifacts
const artifactPath = path.resolve(__dirname, `../../artifacts/contracts/${CONTRACT_NAME}.sol/${CONTRACT_NAME}.json`);
let abi = [];

if (fs.existsSync(artifactPath)) {
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  abi = artifact.abi;
}

// Write ABI file
const abiContent = `export const ${CONTRACT_NAME}ABI = ${JSON.stringify({ abi }, null, 2)} as const;\n`;
fs.writeFileSync(path.join(OUTPUT_DIR, `${CONTRACT_NAME}ABI.ts`), abiContent);

// Read deployment addresses
const addresses = {
  '31337': { address: '0x0000000000000000000000000000000000000000', chainId: 31337, chainName: 'hardhat' },
  '11155111': { address: '0x0000000000000000000000000000000000000000', chainId: 11155111, chainName: 'sepolia' }
};

// Update from deployments if available
['hardhat', 'localhost', 'sepolia'].forEach(network => {
  const deploymentFile = path.join(DEPLOYMENTS_DIR, network, `${CONTRACT_NAME}.json`);
  if (fs.existsSync(deploymentFile)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const chainId = network === 'sepolia' ? '11155111' : '31337';
    addresses[chainId] = {
      address: deployment.address,
      chainId: parseInt(chainId),
      chainName: network === 'sepolia' ? 'sepolia' : 'hardhat'
    };
  }
});

// Write addresses file
const addressesContent = `export const ${CONTRACT_NAME}Addresses: Record<string, { address: \`0x\${string}\`, chainId: number, chainName: string }> = ${JSON.stringify(addresses, null, 2)};\n`;
fs.writeFileSync(path.join(OUTPUT_DIR, `${CONTRACT_NAME}Addresses.ts`), addressesContent);

console.log(`Generated ABI and Addresses for ${CONTRACT_NAME}.`);

