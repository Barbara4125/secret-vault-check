import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useFhevm } from "../hooks/useFhevm";
import { SatisfactionSurveyABI } from "../abi/SatisfactionSurveyABI";
import { SatisfactionSurveyAddresses } from "../abi/SatisfactionSurveyAddresses";

const DEPARTMENTS = [
  { id: 0, name: "Marketing" },
  { id: 1, name: "Sales" },
  { id: 2, name: "Engineering" },
  { id: 3, name: "HR" },
  { id: 4, name: "Finance" },
];

function formatAverage(total: bigint, count: bigint): string {
  return count === 0n ? "-" : (Number(total) / Number(count)).toFixed(2);
}

function SurveyMVP() {
  const chainId = useChainId();
  const { address } = useAccount();
  const effectiveChainId = chainId ?? 31337;

  const contractInfo = useMemo(
      () => SatisfactionSurveyAddresses[effectiveChainId.toString()],
      [effectiveChainId]
  );
  const contractAddress = contractInfo?.address;
  const deployed = contractAddress && contractAddress !== "0x0000000000000000000000000000000000000000";

  const [dept, setDept] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rating, setRating] = useState<string>("5");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const write = useWriteContract();
  const fhe = useFhevm(chainId);

  const [globalTotal, setGlobalTotal] = useState<bigint>(0n);
  const [globalCount, setGlobalCount] = useState<bigint>(0n);
  const [deptTotal, setDeptTotal] = useState<bigint>(0n);
  const [deptCount, setDeptCount] = useState<bigint>(0n);
  const isDecryptingRef = useRef(false);

  // Decrypt aggregates
  useEffect(() => {
  useEffect(() => {
      const run = async () => {
      if (!deployed || !contractAddress || !fhe.isReady || !address) return;
      if (isDecryptingRef.current) return;

      isDecryptingRef.current = true;
      try {
        console.log("[Decrypt]  Reading handles from contract using ethers...");
        
        // Use ethers Contract to read handles directly (like Linkedin project)
        const { ethers } = await import("ethers");
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(
            contractAddress as string,
            SatisfactionSurveyABI.abi,
            provider
        );
        
        // Read global aggregates
        const globalAggResult = await contract.getGlobalAggregates();
        const globalTotalHandle = String(globalAggResult[0]);
        const globalCountHandle = String(globalAggResult[1]);
        
        // Read department aggregates
        const deptAggResult = await contract.getDepartmentAggregates(BigInt(dept));
        const deptTotalHandle = String(deptAggResult[0]);
        const deptCountHandle = String(deptAggResult[1]);
        
        console.log("[Decrypt] Handles from contract (raw):", {
            globalTotal: { value: globalTotalHandle, type: typeof globalTotalHandle, length: globalTotalHandle?.length },
            globalCount: { value: globalCountHandle, type: typeof globalCountHandle, length: globalCountHandle?.length },
            deptTotal: { value: deptTotalHandle, type: typeof deptTotalHandle, length: deptTotalHandle?.length },
            deptCount: { value: deptCountHandle, type: typeof deptCountHandle, length: deptCountHandle?.length },
        });
        
        // Helper function to validate handle
        const isValidHandle = (handle: string): boolean => {
            return !!(handle &&
                   handle.startsWith("0x") &&
                   handle.length === 66 &&
                   handle !== "0x0000000000000000000000000000000000000000000000000000000000000000" &&
                   /^0x[0-9a-fA-F]{64}$/.test(handle));
        };
        
        // Collect all valid handles with type mapping
        const handleMap: Record<string, string[]> = {};
        
        if (isValidHandle(globalTotalHandle)) {
            if (!handleMap[globalTotalHandle]) handleMap[globalTotalHandle] = [];
            handleMap[globalTotalHandle].push('globalTotal');
        } else {
            console.warn("[Decrypt] Invalid globalTotal handle:", globalTotalHandle);
        }
        
        if (isValidHandle(globalCountHandle)) {
            if (!handleMap[globalCountHandle]) handleMap[globalCountHandle] = [];
            handleMap[globalCountHandle].push('globalCount');
        } else {
            console.warn("[Decrypt] Invalid globalCount handle:", globalCountHandle);
        }
        
        if (isValidHandle(deptTotalHandle)) {
            if (!handleMap[deptTotalHandle]) handleMap[deptTotalHandle] = [];
            handleMap[deptTotalHandle].push('deptTotal');
        } else {
            console.warn("[Decrypt] Invalid deptTotal handle:", deptTotalHandle);
        }
        
        if (isValidHandle(deptCountHandle)) {
            if (!handleMap[deptCountHandle]) handleMap[deptCountHandle] = [];
            handleMap[deptCountHandle].push('deptCount');
        } else {
            console.warn("[Decrypt] Invalid deptCount handle:", deptCountHandle);
        }
        
        const uniqueHandles = Object.keys(handleMap);
        
        if (uniqueHandles.length === 0) {
            console.error("===== 解密失败诊断 =====");
            console.error("问题：从合约读取的所�?handle 都无�?);
            console.error("Handle 详情�?);
            console.error("  - Global Total:", globalTotalHandle);
            console.error("  - Global Count:", globalCountHandle);
            console.error("  - Dept Total:", deptTotalHandle);
            console.error("  - Dept Count:", deptCountHandle);
            console.error("");
            console.error("如果 handle �?'0x' 或长度不�?66 字符，说明：");
            console.error("  1. 合约还没有重新部署（需要运行新的部署脚本）");
            console.error("  2. 或者合约已部署但还没有提交任何调查");
            console.error("");
            console.error("解决方案�?);
            console.error("  1. 停止 Hardhat 节点 (Ctrl+C)");
            console.error("  2. 重新启动: npx hardhat node");
            console.error("  3. 重新部署: npx hardhat run scripts/deploy.ts --network localhost");
            console.error("  4. 刷新浏览器页�?);
            console.error("============================");
            
            setGlobalTotal(0n);
            setGlobalCount(0n);
            setDeptTotal(0n);
            setDeptCount(0n);
            return;
        }
        
        console.log("[Decrypt] Batch decrypting", uniqueHandles.length, "unique handles with ONE signature...");
        
        // BATCH decrypt - only ONE signature needed!
        const results = await fhe.decryptMultiple(
            uniqueHandles.map(h => ({ handle: h, contractAddress: contractAddress as string })),
            address as string
        );
        
        
        if (!results || typeof results !== 'object') {
            console.error("[Decrypt] Decryption returned invalid results:", results);
            setGlobalTotal(0n);
            setGlobalCount(0n);
            setDeptTotal(0n);
            setDeptCount(0n);
            return;
        }
        console.log("[Decrypt] Batch decryption complete!", results);
        
        // Ensure results is an object
        
        
        // Apply results using mapping
        for (const [handle, types] of Object.entries(handleMap)) {
            const value = results[handle];
            if (value !== undefined && value !== null) {
            for (const type of types) {
              const bigValue = BigInt(value);
              switch (type) {
                  case 'globalTotal':
                  setGlobalTotal(bigValue);
                  console.log("[Decrypt] Global total:", value);
                  break;
                  case 'globalCount':
                  setGlobalCount(bigValue);
                  console.log("[Decrypt] Global count:", value);
                  break;
                  case 'deptTotal':
                  setDeptTotal(bigValue);
                  console.log("[Decrypt] Department total:", value);
                  break;
                  case 'deptCount':
                  setDeptCount(bigValue);
                  console.log("[Decrypt] Department count:", value);
                  break;
              }
            }
            }
        }
        
        console.log("[Decrypt]  All values displayed successfully!");
      } catch (error) {
        console.error("[Decrypt] Decryption error:", error);
        setGlobalTotal(0n);
        setGlobalCount(0n);
        setDeptTotal(0n);
        setDeptCount(0n);
      } finally {
        isDecryptingRef.current = false;
      }
      };
      run();
  }, [deployed, contractAddress, fhe.isReady, address, chainId, dept]);

  const canSubmit = useMemo(() => {
      const ratingNum = Number.parseInt(rating);
      const ratingOk = Number.isInteger(ratingNum) && ratingNum >= 1 && ratingNum <= 10;
      const chainOk = chainId === 31337 || chainId === 11155111;
      const result = deployed && address && chainOk && fhe.isReady && ratingOk && dept >= 0;

      // Debug logging
      if (!result) {
      console.log("[Submit] Button disabled:", {
        deployed,
        hasAddress: !!address,
        chainId,
        chainOk,
        fheIsReady: fhe.isReady,
        fheLoading: fhe.loading,
        fheError: fhe.error?.message,
        ratingOk,
        dept,
      });
      }

      return result;
  }, [deployed, address, chainId, fhe.isReady, fhe.loading, fhe.error, rating, dept]);

  const onSubmit = useCallback(async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
      const ratingNum = Number.parseInt(rating);
      if (!canSubmit || !contractAddress || !address) return;

      console.log("[Submit]  Starting encryption process...");
      const encrypted = await fhe.encrypt(contractAddress as `0x${string}`, address as `0x${string}`, ratingNum);

      console.log("[Submit] Encryption complete, submitting transaction...");
      const handleScore = encrypted.handles[0] as `0x${string}`;
      const handleOne = encrypted.handles[1] as `0x${string}`;
      const inputProof = encrypted.inputProof as `0x${string}`;

      await write.writeContractAsync({
        abi: SatisfactionSurveyABI.abi,
        address: contractAddress as `0x${string}`,
        functionName: "submitResponse",
        args: [handleScore, inputProof, BigInt(dept), handleOne, inputProof],
      });

      console.log("[Submit] Submission successful!");
    } catch (e: any) {
      console.error("[Submit] Error details:", {
        message: e?.message,
        code: e?.code,
        data: e?.data,
        stack: e?.stack
      });
      console.error("[Submit] Submission failed:", e);
      alert("Submit failed: " + (e?.message ?? String(e)));
      } finally {
        setIsSubmitting(false);
      }
    }, [isSubmitting, canSubmit, contractAddress, address, rating, fhe, write, dept]);
  };

  return (
      <div className="min-h-screen responsive-container bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Employee Satisfaction Survey</h1>
            <div className="flex items-center gap-2">
            <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-6 animate-fade-in">
            <h1 className="text-5xl font-bold text-foreground">
              Anonymous Satisfaction Survey
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Submit encrypted ratings; view decrypted aggregates. Your individual answers are never revealed.
            </p>
            </div>

            <div className="rounded-xl border border-border p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <select
                  className="w-full mt-2 border rounded-md px-3 py-2 bg-background"
                  value={dept}
                  onChange={(e) => {`n                    const newDept = parseInt(e.target.value);`n                    setDept(newDept);`n                    // Reset department aggregates when department changes`n                    setDeptTotal(0n);`n                    setDeptCount(0n);`n                  }}
                  >
                  {DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  </select>
              </div>
              <div>
                  <label className="text-sm text-muted-foreground">Rating (1-10)</label>
                  <input
                  type="number"
                  min={1}
                  max={10}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full mt-2 border rounded-md px-3 py-2 bg-background"
                  />
              </div>
            </div>
            <div className="flex justify-end flex-col items-end gap-2">
              <button 
                  onClick={onSubmit}
                  disabled={!canSubmit || fhe.loading || write.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  {fhe.loading ? "Initializing FHE..." : write.isPending ? "Submitting..." : "Submit"}
              </button>
              {!canSubmit && (
                  <div className="text-xs text-muted-foreground text-right space-y-1">
                  {!address && <p> Please connect your wallet</p>}
                  {address && chainId && chainId !== 31337 && chainId !== 11155111 && (
                    <p> Please switch to local Hardhat network (31337) or Sepolia (11155111)</p>
                  )}
                  {address && (chainId === 31337 || chainId === 11155111) && fhe.loading && (
                    <p>Initializing FHEVM...</p>
                  )}
                  {address && (chainId === 31337 || chainId === 11155111) && !fhe.isReady && !fhe.loading && fhe.error && (
                    <p className="text-sm text-muted-foreground"> {chainId === 11155111 ? 'FHEVM not available on Sepolia' : 'FHEVM initialization failed'}</p>
                  )}
                  {address && (chainId === 31337 || chainId === 11155111) && fhe.isReady && !deployed && (
                    <p> Contract not deployed</p>
                  )}
                  </div>
              )}
            </div>
            {address && chainId !== 31337 && chainId !== 11155111 && (
              <p className="text-xs text-muted-foreground">Note: FHE encryption is supported on local Hardhat (31337) and Sepolia (11155111).</p>
            )}
            {!deployed && address && (chainId === 31337 || chainId === 11155111) && (
              <p className="text-sm text-destructive">Contract not deployed for current chain. Run 'npx hardhat run scripts/deploy.ts --network localhost' and refresh.</p>
            )}
            </div>

            <div className="rounded-xl border border-border p-6 space-y-2">
            <h2 className="text-lg font-semibold">Global Aggregates</h2>
            <p className="text-sm">Total: {globalTotal.toString()} | Count: {globalCount.toString()} | Avg: {formatAverage(globalTotal, globalCount)}</p>
            </div>

            <div className="rounded-xl border border-border p-6 space-y-2">
            <h2 className="text-lg font-semibold">{DEPARTMENTS.find(d => d.id === dept)?.name || "Department"} Aggregates</h2>
            <p className="text-sm">Total: {deptTotal.toString()} | Count: {deptCount.toString()} | Avg: {formatAverage(deptTotal, deptCount)}</p>
            </div>
        </div>
      </main>
      </div>
  );
}

export default function Index() {
  return <SurveyMVP />;
}











