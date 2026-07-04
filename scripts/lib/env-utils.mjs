import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const HARDHAT_ACCOUNT = {
  address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  privateKey: "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
};

export function rootDir(...segments) {
  return path.join(ROOT, ...segments);
}

export function copyEnvIfMissing(relPath) {
  const example = rootDir(relPath + ".example");
  const target = rootDir(relPath);
  if (!fs.existsSync(target) && fs.existsSync(example)) {
    fs.copyFileSync(example, target);
    console.log(`Created ${relPath} from example`);
  }
}

export function upsertEnvVar(filePath, key, value) {
  const abs = rootDir(filePath);
  let content = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : "";
  const regex = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  content = regex.test(content)
    ? content.replace(regex, line)
    : content.trimEnd() + (content.endsWith("\n") ? "" : "\n") + line + "\n";
  fs.writeFileSync(abs, content);
}

export function readDeployment(network = "localhost") {
  const file = rootDir(`blockchain/deployments/${network}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export async function waitForPort(port, host = "127.0.0.1", timeoutMs = 60_000) {
  const net = await import("net");
  const start = Date.now();
  while Date.now() - start < timeoutMs) {
    try {
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ port, host }, () => {
          socket.end();
          resolve(true);
        });
        socket.on("error", reject);
        socket.setTimeout(2000, () => {
          socket.destroy();
          reject(new Error("timeout"));
        });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`Port ${port} not ready after ${timeoutMs}ms`);
}

export async function waitForHttp(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`HTTP ${url} not ready after ${timeoutMs}ms`);
}
