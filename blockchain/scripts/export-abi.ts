import * as fs from "fs";
import * as path from "path";

/**
 * Standalone script to export ABI from compiled artifacts.
 * Run: npm run export:abi
 */
function exportAbi() {
  const artifactPath = path.resolve(
    __dirname,
    "../artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found. Run `npm run compile` first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const abiDir = path.resolve(__dirname, "../abi");
  fs.mkdirSync(abiDir, { recursive: true });

  const output = {
    contractName: "CertificateRegistry",
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    exportedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(abiDir, "CertificateRegistry.json"), JSON.stringify(output, null, 2));
  console.log("ABI exported to abi/CertificateRegistry.json");

  const backendDir = path.resolve(__dirname, "../../backend/src/abi");
  if (fs.existsSync(path.resolve(__dirname, "../../backend"))) {
    fs.mkdirSync(backendDir, { recursive: true });
    fs.writeFileSync(
      path.join(backendDir, "CertificateRegistry.json"),
      JSON.stringify(artifact.abi, null, 2)
    );
    console.log("ABI copied to backend/src/abi/CertificateRegistry.json");
  }
}

exportAbi();
