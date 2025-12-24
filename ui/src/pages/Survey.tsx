import { useMemo, useState, useCallback } from 'react'
import { useAccount, useChainId, useWriteContract } from 'wagmi'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle, AlertCircle, Loader2, Star, Building2 } from 'lucide-react'
import PageTransition, { StaggerContainer, StaggerItem } from '../components/PageTransition'
import Card from '../components/Card'
import { useFhevm } from '../hooks/useFhevm'
import { SatisfactionSurveyABI } from '../abi/SatisfactionSurveyABI'
import { SatisfactionSurveyAddresses } from '../abi/SatisfactionSurveyAddresses'

const DEPARTMENTS = [
  { id: 0, name: 'Marketing', icon: '📢', color: 'from-pink-500 to-rose-500' },
  { id: 1, name: 'Sales', icon: '💼', color: 'from-green-500 to-emerald-500' },
  { id: 2, name: 'Engineering', icon: '⚙️', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'HR', icon: '👥', color: 'from-purple-500 to-violet-500' },
  { id: 4, name: 'Finance', icon: '💰', color: 'from-yellow-500 to-orange-500' },
]

export default function Survey() {
  const chainId = useChainId()
  const { address } = useAccount()
  const effectiveChainId = chainId ?? 31337

  const contractInfo = useMemo(
    () => SatisfactionSurveyAddresses[effectiveChainId.toString()],
    [effectiveChainId]
  )
  const contractAddress = contractInfo?.address
  const deployed = contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000'

  const [dept, setDept] = useState<number>(0)
  const [rating, setRating] = useState<number>(5)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const write = useWriteContract()
  const fhe = useFhevm(chainId)

  const canSubmit = useMemo(() => {
    const ratingOk = rating >= 1 && rating <= 10
    const chainOk = chainId === 31337 || chainId === 11155111
    return deployed && address && chainOk && fhe.isReady && ratingOk && dept >= 0
  }, [deployed, address, chainId, fhe.isReady, rating, dept])

  const onSubmit = useCallback(async () => {
    if (isSubmitting || !canSubmit || !contractAddress || !address) return
    
    setIsSubmitting(true)
    setSubmitSuccess(false)
    
    try {
      console.log('[Submit] Starting encryption process...')
      const encrypted = await fhe.encrypt(
        contractAddress as `0x${string}`,
        address as `0x${string}`,
        rating
      )

      console.log('[Submit] Encryption complete, submitting transaction...')
      const handleScore = encrypted.handles[0] as `0x${string}`
      const handleOne = encrypted.handles[1] as `0x${string}`
      const inputProof = encrypted.inputProof as `0x${string}`

      await write.writeContractAsync({
        abi: SatisfactionSurveyABI.abi,
        address: contractAddress as `0x${string}`,
        functionName: 'submitResponse',
        args: [handleScore, inputProof, BigInt(dept), handleOne, inputProof],
      })

      console.log('[Submit] Submission successful!')
      setSubmitSuccess(true)
      
      // Reset after success
      setTimeout(() => {
        setSubmitSuccess(false)
      }, 3000)
    } catch (e: any) {
      console.error('[Submit] Submission failed:', e)
      alert('Submission failed: ' + (e?.message ?? String(e)))
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, canSubmit, contractAddress, address, rating, fhe, write, dept])

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12">
        <StaggerContainer className="max-w-2xl mx-auto">
          {/* Header */}
          <StaggerItem>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mb-6 glow-primary"
              >
                <Send className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="gradient-text">Submit Survey</span>
              </h1>
              <p className="text-muted-foreground">
                Your rating will be encrypted before submission. Individual answers are never revealed.
              </p>
            </div>
          </StaggerItem>

          {/* Status Messages */}
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
                  <span className="text-yellow-500">Please connect your wallet first</span>
                </motion.div>
              </StaggerItem>
            )}
          </AnimatePresence>

          {/* Department Selection */}
          <StaggerItem>
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Select Department</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DEPARTMENTS.map((d) => (
                  <motion.button
                    key={d.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDept(d.id)}
                    className={`p-4 rounded-xl border transition-all ${
                      dept === d.id
                        ? 'border-primary bg-primary/10 glow-primary'
                        : 'border-border/50 bg-card/50 hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{d.icon}</span>
                    <span className={`text-sm font-medium ${dept === d.id ? 'text-primary' : ''}`}>
                      {d.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </StaggerItem>

          {/* Rating Selection */}
          <StaggerItem>
            <Card className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Satisfaction Rating</h2>
                <span className="ml-auto text-2xl font-bold gradient-text">
                  {hoveredRating ?? rating}
                </span>
              </div>
              
              {/* Star Rating */}
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                  <motion.button
                    key={value}
                    whileHover={{ scale: 1.2, y: -4 }}
                    whileTap={{ scale: 0.9 }}
                    onMouseEnter={() => setHoveredRating(value)}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={() => setRating(value)}
                    className="relative"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        value <= (hoveredRating ?? rating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                    {value === rating && (
                      <motion.div
                        layoutId="rating-indicator"
                        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                      />
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Rating Labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Very Dissatisfied</span>
                <span>Very Satisfied</span>
              </div>
            </Card>
          </StaggerItem>

          {/* Submit Button */}
          <StaggerItem>
            <motion.button
              whileHover={canSubmit ? { scale: 1.02 } : undefined}
              whileTap={canSubmit ? { scale: 0.98 } : undefined}
              onClick={onSubmit}
              disabled={!canSubmit || fhe.loading || write.isPending || isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all ${
                submitSuccess
                  ? 'bg-green-500 text-white'
                  : 'btn-gradient text-white'
              }`}
            >
              <AnimatePresence mode="wait">
                {submitSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Submitted Successfully!
                  </motion.div>
                ) : isSubmitting || write.isPending ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {fhe.loading ? 'Initializing FHE...' : 'Encrypting & Submitting...'}
                  </motion.div>
                ) : (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    Encrypt & Submit
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </StaggerItem>

          {/* Help Text */}
          <StaggerItem>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {!deployed && address && (
                <p className="text-destructive">
                  Contract not deployed. Please run 'npx hardhat run scripts/deploy.ts --network localhost' and refresh.
                </p>
              )}
              {address && chainId !== 31337 && chainId !== 11155111 && (
                <p>Please switch to local Hardhat network (31337) or Sepolia (11155111)</p>
              )}
              {fhe.loading && <p>Initializing FHEVM...</p>}
            </div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
