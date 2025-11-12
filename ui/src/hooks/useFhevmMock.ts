import { useState, useEffect, useCallback } from "react";
import { isAddress } from "viem";

// Import FHEVM mock types
type FhevmInstance = any;

export function useFhevmMock({ chainId }: { chainId?: number }) {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Only initialize for local Hardhat (chainId 31337)
    if (chainId !== 31337) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        setLoading(true);
        setError(null);

        // Fetch relayer metadata
        const metadata = await fetchRelayerMetadata("http://localhost:8545");
        
        // Dynamically import FHEVM mock
        const { createInstance } = await import("fhevmjs/node");
        
        const fhevmInstance = await createInstance({
          chainId: 31337,
          networkUrl: "http://localhost:8545",
          gatewayUrl: "http://localhost:8545",
          aclAddress: metadata.ACLAddress,
          kmsVerifierAddress: metadata.KMSVerifierAddress,
        });

        if (!cancelled) {
          setInstance(fhevmInstance);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[useFhevmMock] init error:", err);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [chainId]);

  const encryptInputs = useCallback(
    async (contract: `0x${string}`, user: `0x${string}`, score: number) => {
      if (!instance) throw new Error("FHEVM instance not ready");
      if (!isAddress(contract) || !isAddress(user)) throw new Error("Invalid address");
      
      const input = instance.createEncryptedInput(contract, user);
      input.add32(score);
      input.add32(1);
      return input.encrypt();
    },
    [instance]
  );

  const buildTypedData = useCallback(
    (contract: `0x${string}`) => {
      if (!instance) throw new Error("FHEVM instance not ready");
      const { publicKey } = ensureKeypair();
      const startTimestamp = Math.floor(Date.now() / 1000);
      const durationDays = 365;
      const eip712 = instance.createEIP712(publicKey, [contract], startTimestamp, durationDays);
      return { eip712, startTimestamp, durationDays };
    },
    [instance]
  );

  const decryptHandles = useCallback(
    async (
      contract: `0x${string}`, 
      user: `0x${string}`, 
      signature: `0x${string}`, 
      handles: string[],
      startTimestamp?: number,
      durationDays?: number
    ) => {
      if (!instance) throw new Error("FHEVM instance not ready");
      const { publicKey, privateKey } = ensureKeypair();
      const start = startTimestamp ?? Math.floor(Date.now() / 1000);
      const duration = durationDays ?? 365;
      const items = handles.map((h) => ({ handle: h, contractAddress: contract }));
      return instance.userDecrypt(items, privateKey, publicKey, signature, [contract], user, start, duration);
    },
    [instance]
  );

  function ensureKeypair() {
    const stored = localStorage.getItem("fhevm-keypair");
    if (stored) {
      return JSON.parse(stored);
    }
    const keypair = instance.generateKeypair();
    localStorage.setItem("fhevm-keypair", JSON.stringify(keypair));
    return keypair;
  }

  return {
    instance,
    loading,
    error,
    encryptInputs,
    buildTypedData,
    decryptHandles,
  };
}

async function fetchRelayerMetadata(rpcUrl: string) {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "fhevm_relayer_metadata", params: [] });
  const res = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body });
  if (!res.ok) throw new Error("Cannot fetch FHEVM relayer metadata");
  const json = await res.json();
  if (json && typeof json === "object" && "result" in json && json.result) {
    return json.result as {
      ACLAddress: `0x${string}`;
      InputVerifierAddress: `0x${string}`;
      KMSVerifierAddress: `0x${string}`;
    };
  }
  throw new Error("Invalid relayer metadata response");
}

