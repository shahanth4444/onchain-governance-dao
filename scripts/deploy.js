const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("Starting deployment...\n");

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);
    console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "\n");

    // Deploy GovernanceToken
    console.log("Deploying GovernanceToken...");
    const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
    const governanceToken = await GovernanceToken.deploy();
    await governanceToken.waitForDeployment();
    const tokenAddress = await governanceToken.getAddress();
    console.log("GovernanceToken deployed to:", tokenAddress);

    // Delegate voting power to deployer (required for voting)
    console.log("\nDelegating voting power to deployer...");
    const delegateTx = await governanceToken.delegate(deployer.address);
    await delegateTx.wait();
    console.log("Voting power delegated");

    // Deploy MyGovernor
    console.log("\nDeploying MyGovernor...");
    const MyGovernor = await hre.ethers.getContractFactory("MyGovernor");
    const governor = await MyGovernor.deploy(tokenAddress);
    await governor.waitForDeployment();
    const governorAddress = await governor.getAddress();
    console.log("MyGovernor deployed to:", governorAddress);

    // Save deployment addresses
    const deploymentInfo = {
        network: hre.network.name,
        governanceToken: tokenAddress,
        governor: governorAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
    };

    const deploymentPath = path.join(__dirname, "..", "deployedAddresses.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log("\nDeployment info saved to deployedAddresses.json");

    // Save ABIs for frontend
    const artifactsDir = path.join(__dirname, "..", "artifacts", "contracts");
    const frontendDir = path.join(__dirname, "..", "frontend", "src", "contracts");

    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    // Copy GovernanceToken ABI
    const tokenArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "GovernanceToken.sol", "GovernanceToken.json"))
    );
    fs.writeFileSync(
        path.join(frontendDir, "GovernanceToken.json"),
        JSON.stringify({ abi: tokenArtifact.abi, address: tokenAddress }, null, 2)
    );

    // Copy MyGovernor ABI
    const governorArtifact = JSON.parse(
        fs.readFileSync(path.join(artifactsDir, "MyGovernor.sol", "MyGovernor.json"))
    );
    fs.writeFileSync(
        path.join(frontendDir, "MyGovernor.json"),
        JSON.stringify({ abi: governorArtifact.abi, address: governorAddress }, null, 2)
    );

    console.log("ABIs copied to frontend/contracts/\n");

    console.log("=".repeat(50));
    console.log("DEPLOYMENT SUMMARY");
    console.log("=".repeat(50));
    console.log("Network:", hre.network.name);
    console.log("GovernanceToken:", tokenAddress);
    console.log("MyGovernor:", governorAddress);
    console.log("Deployer:", deployer.address);
    console.log("=".repeat(50));
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
