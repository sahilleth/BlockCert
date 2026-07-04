import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

interface DeploymentRecord {
  network: string;
  chainId: number;
  contractName: string;
  contractAddress: string;
  deployer: string;
  owner: string;
  deployedAt: string;
  blockNumber: number;
}

async function main() {
  const signers = await ethers.getSigners();
  if (signers.length === 0) {
    console.error("\n❌ No deployer wallet — cannot deploy to", network.name);
    console.error("\nCreate blockchain/.env with:");
    console.error("  PRIVATE_KEY=your_metamask_private_key_without_0x_prefix");
    console.error("  AMOY_RPC_URL=https://rpc-amoy.polygon.technology");
    console.error("\nFund the wallet with Amoy test MATIC:");
    console.error("  https://faucet.polygon.technology/\n");
    process.exit(1);
  }

  const [deployer] = signers;
  const net = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════════════");
  console.log(" BlockCert — CertificateRegistry Deployment");
  console.log("═══════════════════════════════════════════════════════");
  console.log("Network  :", network.name);
  console.log("Chain ID :", net.chainId.toString());
  console.log("Deployer :", deployer.address);
  console.log(
    "Balance  :",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "MATIC"
  );
  console.log("───────────────────────────────────────────────────────");

  const Factory = await ethers.getContractFactory("CertificateRegistry");
  const registry = await Factory.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  const deployTx = registry.deploymentTransaction();
  const receipt = deployTx ? await deployTx.wait() : null;

  console.log("Contract :", address);
  console.log("Owner    :", await registry.owner());
  console.log("Tx Hash  :", deployTx?.hash ?? "n/a");
  console.log("═══════════════════════════════════════════════════════");

  const deployment: DeploymentRecord = {
    network: network.name,
    chainId: Number(net.chainId),
    contractName: "CertificateRegistry",
    contractAddress: address,
    deployer: deployer.address,
    owner: await registry.owner(),
    deployedAt: new Date().toISOString(),
    blockNumber: receipt?.blockNumber ?? 0,
  };

  // Save per-network deployment record
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const networkFile = path.join(deploymentsDir, `${network.name}.json`);
  fs.writeFileSync(networkFile, JSON.stringify(deployment, null, 2));
  console.log("Saved    :", networkFile);

  // Save latest deployment pointer
  const latestFile = path.join(deploymentsDir, "latest.json");
  fs.writeFileSync(latestFile, JSON.stringify(deployment, null, 2));

  // Export ABI alongside deployment
  exportAbi();

  console.log("\nNext steps:");
  console.log("  1. Copy contractAddress to backend/.env → CONTRACT_ADDRESS");
  console.log("  2. Copy contractAddress to backend/.env → CONTRACT_ADDRESS");
  console.log("  3. Verify on Polygonscan:");
  console.log(`     npx hardhat verify --network ${network.name} ${address}`);
}

function exportAbi() {
  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "CertificateRegistry.sol",
    "CertificateRegistry.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.warn("ABI export skipped — run `npm run compile` first");
    return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abiDir = path.join(__dirname, "..", "abi");
  fs.mkdirSync(abiDir, { recursive: true });

  const abiOutput = {
    contractName: "CertificateRegistry",
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    exportedAt: new Date().toISOString(),
  };

  const abiFile = path.join(abiDir, "CertificateRegistry.json");
  fs.writeFileSync(abiFile, JSON.stringify(abiOutput, null, 2));
  console.log("Saved    :", abiFile);

  // Copy ABI to backend for convenience
  const backendAbiDir = path.join(__dirname, "..", "..", "backend", "src", "abi");
  if (fs.existsSync(path.join(__dirname, "..", "..", "backend"))) {
    fs.mkdirSync(backendAbiDir, { recursive: true });
    fs.writeFileSync(
      path.join(backendAbiDir, "CertificateRegistry.json"),
      JSON.stringify(artifact.abi, null, 2)
    );
    console.log("Saved    : backend/src/abi/CertificateRegistry.json");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
