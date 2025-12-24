import { useMemo, useState, useRef, useCallback, useEffect } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Unlock, Lock, Sparkles, Eye, 
  Zap, Shield, AlertCircle, CheckCircle2
} from 'lucide-react'
import PageTransition, { StaggerContainer, StaggerItem } from '../components/PageTransition'
import Card from '../components/Card'
import { useFhevm } from '../hooks/useFhevm'
import { SatisfactionSurveyABI } from '../abi/SatisfactionSurveyABI'
import { SatisfactionSurveyAddresses } from '../abi/SatisfactionSurveyAddresses'

const DEPARTMENTS = [
  { id: 0, name: 'Marketing', icon: '📢' },
  { id: 1, name: 'Sales', icon: '💼' },
  { id: 2, name: 'Engineering', icon: '⚙️' },
  { id: 3, name: 'HR', icon: '👥' },
  { id: 4, name: 'Finance', icon: '💰' },
]

interface DecryptedValue {
  value: bigint
  isRevealed: boolean
  isDecrypting: boolean
}

// Scramble effect component
function ScrambleNumber({ 
  value, 
  isRevealing, 
}: { 
  value: string
  isRevealing: boolean
}) {
  const [displayValue, setDisplayValue] = useState('???')

  useEffect(() => {
    if (!isRevealing) {
      setDisplayValue('???')
      return
    }

    const chars = '0123456789'
    const targetLength = value.length
    let currentIteration = 0
    const maxIterations = 20

    const interval = setInterval(() => {
      currentIteration++
      
      if (currentIteration >= maxIterations) {
        setDisplayValue(value)
        clearInterval(interval)
        return
      }

      // Gradually reveal characters
      const revealedCount = Math.floor((currentIteration / maxIterations) * targetLength)
      let newValue = ''
      
      for (let i = 0; i < targetLength; i++) {
        if (i < revealedCount) {
          newValue += value[i]
        } else {
          newValue += chars[Math.floor(Math.random() * chars.length)]
        }
      }
      
      setDisplayValue(newValue)
    }, 50)

    return () => clearInterval(interval)
  }, [isRevealing, value])

  return <span className="font-mono">{displayValue}</span>
}

export default function Decrypt() {
  const chainId = useChainId()
  const { address } = useAccount()
  const effectiveChainId = chainId ?? 31337

  const contractInfo = useMemo(
    () => SatisfactionSurveyAddresses[effectiveChainId.toString()],
    [effectiveChainId]
  )
  const contractAddress = contractInfo?.address
  const deployed = contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000'

  const fhe = useFhevm(chainId)
  const isDecryptingRef = useRef(false)

  const [selectedDept, setSelectedDept] = useState<number>(0)
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [decryptPhase, setDecryptPhase] = useState<'idle' | 'signing' | 'decrypting' | 'revealing' | 'complete'>('idle')
  
  const [globalData, setGlobalData] = useState<{ total: DecryptedValue; count: DecryptedValue }>({
    total: { value: 0n, isRevealed: false, isDecrypting: false },
    count: { value: 0n, isRevealed: false, isDecrypting: false },
  })
  
  const [deptData, setDeptData] = useState<{ total: DecryptedValue; count: DecryptedValue }>({
    total: { value: 0n, isRevealed: false, isDecrypting: false },
    count: { value: 0n, isRevealed: false, isDecrypting: false },
  })

  const [showParticles, setShowParticles] = useState(false)

  const startDecryption = useCallback(async () => {
    if (!deployed || !contractAddress || !fhe.isReady || !address) return
    if (isDecryptingRef.current) return

    isDecryptingRef.current = true
    setIsDecrypting(true)
    setDecryptPhase('signing')
    setShowParticles(false)

    // Reset reveal states
    setGlobalData(prev => ({
      total: { ...prev.total, isRevealed: false, isDecrypting: true },
      count: { ...prev.count, isRevealed: false, isDecrypting: true },
    }))
    setDeptData(prev => ({
      total: { ...prev.total, isRevealed: false, isDecrypting: true },
      count: { ...prev.count, isRevealed: false, isDecrypting: true },
    }))

    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const contract = new ethers.Contract(
        contractAddress as string,
        SatisfactionSurveyABI.abi,
        provider
      )

      // Collect handles
      const handleMap: Record<string, string[]> = {}
      const isValidHandle = (handle: string): boolean => {
        return !!(handle &&
          handle.startsWith('0x') &&
          handle.length === 66 &&
          handle !== '0x0000000000000000000000000000000000000000000000000000000000000000' &&
          /^0x[0-9a-fA-F]{64}$/.test(handle))
      }

      const globalAggResult = await contract.getGlobalAggregates()
      const globalTotalHandle = String(globalAggResult[0])
      const globalCountHandle = String(globalAggResult[1])

      if (isValidHandle(globalTotalHandle)) {
        if (!handleMap[globalTotalHandle]) handleMap[globalTotalHandle] = []
        handleMap[globalTotalHandle].push('globalTotal')
      }
      if (isValidHandle(globalCountHandle)) {
        if (!handleMap[globalCountHandle]) handleMap[globalCountHandle] = []
        handleMap[globalCountHandle].push('globalCount')
      }

      const deptAggResult = await contract.getDepartmentAggregates(BigInt(selectedDept))
      const deptTotalHandle = String(deptAggResult[0])
      const deptCountHandle = String(deptAggResult[1])

      if (isValidHandle(deptTotalHandle)) {
        if (!handleMap[deptTotalHandle]) handleMap[deptTotalHandle] = []
        handleMap[deptTotalHandle].push('deptTotal')
      }
      if (isValidHandle(deptCountHandle)) {
        if (!handleMap[deptCountHandle]) handleMap[deptCountHandle] = []
        handleMap[deptCountHandle].push('deptCount')
      }

      const uniqueHandles = Object.keys(handleMap)
      
      if (uniqueHandles.length === 0) {
        setDecryptPhase('complete')
        setIsDecrypting(false)
        isDecryptingRef.current = false
        return
      }

      setDecryptPhase('decrypting')

      // Batch decrypt
      const results = await fhe.decryptMultiple(
        uniqueHandles.map(h => ({ handle: h, contractAddress: contractAddress as string })),
        address as string
      )

      if (!results || typeof results !== 'object') {
        throw new Error('Decryption failed')
      }

      setDecryptPhase('revealing')
      setShowParticles(true)

      // Apply results with delay for dramatic effect
      await new Promise(resolve => setTimeout(resolve, 500))

      for (const [handle, types] of Object.entries(handleMap)) {
        const value = results[handle]
        if (value !== undefined && value !== null) {
          for (const type of types) {
            const bigValue = BigInt(value)
            if (type === 'globalTotal') {
              setGlobalData(prev => ({
                ...prev,
                total: { value: bigValue, isRevealed: true, isDecrypting: false }
              }))
            } else if (type === 'globalCount') {
              setGlobalData(prev => ({
                ...prev,
                count: { value: bigValue, isRevealed: true, isDecrypting: false }
              }))
            } else if (type === 'deptTotal') {
              setDeptData(prev => ({
                ...prev,
                total: { value: bigValue, isRevealed: true, isDecrypting: false }
              }))
            } else if (type === 'deptCount') {
              setDeptData(prev => ({
                ...prev,
                count: { value: bigValue, isRevealed: true, isDecrypting: false }
              }))
            }
          }
        }
      }

      setDecryptPhase('complete')

      // Hide particles after animation
      setTimeout(() => setShowParticles(false), 3000)

    } catch (error) {
      console.error('[Decrypt] Error:', error)
      setDecryptPhase('idle')
    } finally {
      setIsDecrypting(false)
      isDecryptingRef.current = false
    }
  }, [deployed, contractAddress, fhe, address, selectedDept])

  const globalAvg = globalData.count.value > 0n
    ? (Number(globalData.total.value) / Number(globalData.count.value)).toFixed(2)
    : '-'

  const deptAvg = deptData.count.value > 0n
    ? (Number(deptData.total.value) / Number(deptData.count.value)).toFixed(2)
    : '-'

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12 relative">
        {/* Celebration particles */}
        <AnimatePresence>
          {showParticles && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-50"
            >
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: '50vw',
                    y: '50vh',
                    scale: 0,
                  }}
                  animate={{
                    x: `${Math.random() * 100}vw`,
                    y: `${Math.random() * 100}vh`,
                    scale: [0, 1, 0],
                    rotate: Math.random() * 720,
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    ease: 'easeOut',
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    background: `hsl(${Math.random() * 60 + 240}, 80%, 60%)`,
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <StaggerContainer className="max-w-3xl mx-auto">
          {/* Header */}
          <StaggerItem>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-6 glow-accent"
              >
                <Unlock className="w-10 h-10 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="gradient-text">Decrypt Center</span>
              </h1>
              <p className="text-muted-foreground">
                Decrypt and reveal encrypted aggregate data. Experience the magic of FHE.
              </p>
            </div>
          </StaggerItem>

          {/* Status */}
          <AnimatePresence>
            {!address && (
              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  <span className="text-yellow-500">Please connect your wallet to decrypt</span>
                </motion.div>
              </StaggerItem>
            )}
          </AnimatePresence>

          {/* Department Selection */}
          <StaggerItem>
            <Card className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Select Department to Decrypt</h2>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((dept) => (
                  <motion.button
                    key={dept.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDept(dept.id)}
                    className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
                      selectedDept === dept.id
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <span>{dept.icon}</span>
                    <span>{dept.name}</span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </StaggerItem>

          {/* Decrypt Button */}
          <StaggerItem>
            <motion.button
              whileHover={!isDecrypting ? { scale: 1.02 } : undefined}
              whileTap={!isDecrypting ? { scale: 0.98 } : undefined}
              onClick={startDecryption}
              disabled={isDecrypting || !fhe.isReady || !address}
              className="w-full py-6 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 btn-gradient text-white mb-8 relative overflow-hidden"
            >
              {/* Animated background */}
              {isDecrypting && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary"
                  animate={{
                    x: ['-100%', '100%'],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                  style={{ opacity: 0.3 }}
                />
              )}
              
              <AnimatePresence mode="wait">
                {decryptPhase === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Zap className="w-6 h-6" />
                    Start Decryption
                  </motion.div>
                )}
                {decryptPhase === 'signing' && (
                  <motion.div
                    key="signing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Shield className="w-6 h-6 animate-pulse" />
                    Please sign in wallet...
                  </motion.div>
                )}
                {decryptPhase === 'decrypting' && (
                  <motion.div
                    key="decrypting"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Lock className="w-6 h-6 animate-spin" />
                    Decrypting data...
                  </motion.div>
                )}
                {decryptPhase === 'revealing' && (
                  <motion.div
                    key="revealing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <Sparkles className="w-6 h-6 animate-pulse" />
                    Revealing results...
                  </motion.div>
                )}
                {decryptPhase === 'complete' && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Decryption Complete!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </StaggerItem>

          {/* Results */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Global Results */}
            <StaggerItem>
              <Card className={`relative overflow-hidden ${globalData.total.isRevealed ? 'glow-primary' : ''}`}>
                <div className="flex items-center gap-3 mb-6">
                  <Eye className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold">Global Data</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Total Score</p>
                    <p className="text-3xl font-bold">
                      {globalData.total.isRevealed ? (
                        <motion.span
                          initial={{ filter: 'blur(10px)', opacity: 0 }}
                          animate={{ filter: 'blur(0px)', opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="gradient-text"
                        >
                          <ScrambleNumber 
                            value={globalData.total.value.toString()} 
                            isRevealing={globalData.total.isRevealed}
                          />
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground">
                          {globalData.total.isDecrypting ? '***' : '???'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Response Count</p>
                    <p className="text-3xl font-bold">
                      {globalData.count.isRevealed ? (
                        <motion.span
                          initial={{ filter: 'blur(10px)', opacity: 0 }}
                          animate={{ filter: 'blur(0px)', opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="gradient-text"
                        >
                          <ScrambleNumber 
                            value={globalData.count.value.toString()} 
                            isRevealing={globalData.count.isRevealed}
                          />
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground">
                          {globalData.count.isDecrypting ? '***' : '???'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20">
                    <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                    <p className="text-4xl font-bold">
                      {globalData.total.isRevealed && globalData.count.isRevealed ? (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', bounce: 0.5, delay: 0.5 }}
                          className="gradient-text"
                        >
                          {globalAvg}
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Reveal overlay effect */}
                <AnimatePresence>
                  {globalData.total.isDecrypting && !globalData.total.isRevealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </Card>
            </StaggerItem>

            {/* Department Results */}
            <StaggerItem>
              <Card className={`relative overflow-hidden ${deptData.total.isRevealed ? 'glow-secondary' : ''}`}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-xl">{DEPARTMENTS[selectedDept].icon}</span>
                  <h2 className="text-lg font-semibold">{DEPARTMENTS[selectedDept].name}</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Department Total</p>
                    <p className="text-3xl font-bold">
                      {deptData.total.isRevealed ? (
                        <motion.span
                          initial={{ filter: 'blur(10px)', opacity: 0 }}
                          animate={{ filter: 'blur(0px)', opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="gradient-text"
                        >
                          <ScrambleNumber 
                            value={deptData.total.value.toString()} 
                            isRevealing={deptData.total.isRevealed}
                          />
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground">
                          {deptData.total.isDecrypting ? '***' : '???'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Department Responses</p>
                    <p className="text-3xl font-bold">
                      {deptData.count.isRevealed ? (
                        <motion.span
                          initial={{ filter: 'blur(10px)', opacity: 0 }}
                          animate={{ filter: 'blur(0px)', opacity: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="gradient-text"
                        >
                          <ScrambleNumber 
                            value={deptData.count.value.toString()} 
                            isRevealing={deptData.count.isRevealed}
                          />
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground">
                          {deptData.count.isDecrypting ? '***' : '???'}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-gradient-to-r from-secondary/20 to-accent/20">
                    <p className="text-sm text-muted-foreground mb-1">Department Average</p>
                    <p className="text-4xl font-bold">
                      {deptData.total.isRevealed && deptData.count.isRevealed ? (
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', bounce: 0.5, delay: 0.5 }}
                          className="gradient-text"
                        >
                          {deptAvg}
                        </motion.span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {deptData.total.isDecrypting && !deptData.total.isRevealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-gradient-to-t from-secondary/10 to-transparent pointer-events-none"
                    />
                  )}
                </AnimatePresence>
              </Card>
            </StaggerItem>
          </div>

          {/* Info */}
          <StaggerItem>
            <div className="mt-8 p-4 rounded-xl bg-muted/20 border border-border/50">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">About FHE Decryption</h3>
                  <p className="text-sm text-muted-foreground">
                    Fully Homomorphic Encryption (FHE) allows computation on encrypted data. 
                    The decryption process requires your wallet signature for identity verification, 
                    but only aggregate results are decrypted - individual votes remain encrypted forever.
                  </p>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
