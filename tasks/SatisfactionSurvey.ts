import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("survey:address", "Prints the SatisfactionSurvey address").setAction(async function (_args: TaskArguments, hre) {
  const { deployments } = hre;
  const deployment = await deployments.get("SatisfactionSurvey");
  console.log(`SatisfactionSurvey address is ${deployment.address}`);
});

task("survey:submit", "Submit an encrypted satisfaction score (mock)")
  .addParam("value", "Satisfaction score (integer, e.g., 1..10)")
  .addParam("dept", "Department id (integer)")
  .addOptionalParam("address", "Optionally specify the SatisfactionSurvey contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const value = parseInt(args.value);
    const dept = parseInt(args.dept);
    if (isNaN(value) || value < 1 || value > 10) {
      throw new Error("Value must be an integer between 1 and 10");
    }
    if (isNaN(dept) || dept < 0) {
      throw new Error("Department id must be a non-negative integer");
    }

    const deployment = args.address ? { address: args.address } : await deployments.get("SatisfactionSurvey");
    console.log(`SatisfactionSurvey: ${deployment.address}`);
    console.log(`Note: This is a simplified version. Full FHE encryption requires fhevmjs library.`);
    console.log(`Value: ${value}, Department: ${dept}`);
    console.log(`To enable full FHE features, install fhevmjs and use the frontend.`);
  });

task("survey:get-global", "Get global aggregates (requires FHE decryption)")
  .addOptionalParam("address", "Optionally specify the SatisfactionSurvey contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const deployment = args.address ? { address: args.address } : await deployments.get("SatisfactionSurvey");
    const signers = await ethers.getSigners();
    const contract = await ethers.getContractAt("SatisfactionSurvey", deployment.address);

    const [encTotal, encCount] = await contract.getGlobalAggregates();
    console.log(`Encrypted total: ${encTotal}`);
    console.log(`Encrypted count: ${encCount}`);
    console.log(`Note: Decryption requires fhevmjs library. Use the frontend for full functionality.`);
  });

task("survey:get-dept", "Get department aggregates (requires FHE decryption)")
  .addParam("dept", "Department id (integer)")
  .addOptionalParam("address", "Optionally specify the SatisfactionSurvey contract address")
  .setAction(async function (args: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const dept = parseInt(args.dept);
    if (isNaN(dept) || dept < 0) {
      throw new Error("Department id must be a non-negative integer");
    }

    const deployment = args.address ? { address: args.address } : await deployments.get("SatisfactionSurvey");
    const contract = await ethers.getContractAt("SatisfactionSurvey", deployment.address);

    const [encTotal, encCount] = await contract.getDepartmentAggregates(dept);
    console.log(`Department ${dept}:`);
    console.log(`Encrypted total: ${encTotal}`);
    console.log(`Encrypted count: ${encCount}`);
    console.log(`Note: Decryption requires fhevmjs library. Use the frontend for full functionality.`);
  });
