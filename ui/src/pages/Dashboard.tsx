import { useEffect, useMemo, useState, useRef } from 'react'
import { useAccount, useChainId } from 'wagmi'
import { motion } from 'framer-motion'
import { 
  BarChart3, Users, TrendingUp, Building2, 
  RefreshCw, Activity, Award
} from 'lucide-react'
import PageTransition, { StaggerContainer, StaggerItem } from '../components/PageTransition'
import Card, { StatCard } from '../components/Card'
import { useFhevm } from '../hooks/useFhevm'
import { SatisfactionSurveyABI } from '../abi/SatisfactionSurveyABI'
import { SatisfactionSurveyAddresses } from '../abi/SatisfactionSurveyAddresses'

const DEPARTMENTS = [
  { id: 0, name: 'Marketing', icon: '📢', color: 'bg-pink-500' },
  { id: 1, name: 'Sales', icon: '💼', color: 'bg-green-500' },
  { id: 2, name: 'Engineering', icon: '⚙️', color: 'bg-blue-500' },
  { id: 3, name: 'HR', icon: '👥', color: 'bg-purple-500' },
  { id: 4, name: 'Finance', icon: '💰', color: 'bg-yellow-500' },
]

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-400'
  if (score >= 6) return 'text-yellow-400'
  if (score >= 4) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreLabel(score: number): string {
  if (score >= 8) return 'Excellent'
  if (score >= 6) return 'Good'
  if (score >= 4) return 'Average'
  return 'Needs Improvement'
}

export default function Dashboard() {
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

  const [globalTotal, setGlobalTotal] = useState<bigint>(0n)
  const [globalCount, setGlobalCount] = useState<bigint>(0n)
  const [deptData, setDeptData] = useState<{ total: bigint; count: bigint }[]>(
    DEPARTMENTS.map(() => ({ total: 0n, count: 0n }))
  )
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const globalAverage = useMemo(() => {
    if (globalCount === 0n) return 0
    return Number(globalTotal) / Number(globalCount)
  }, [globalTotal, globalCount])

  const totalResponses = useMemo(() => Number(globalCount), [globalCount])

  const highestDept = useMemo(() => {
    let highest = { index: -1, avg: 0 }
    deptData.forEach((d, i) => {
      if (d.count > 0n) {
        const avg = Number(d.total) / Number(d.count)
        if (avg > highest.avg) {
          highest = { index: i, avg }
        }
      }
    })
    return highest.index >= 0 ? DEPARTMENTS[highest.index].name : '-'
  }, [deptData])

  const fetchData = async () => {
    if (!deployed || !contractAddress || !fhe.isReady || !address) return
    if (isDecryptingRef.current) return

    isDecryptingRef.current = true
    setIsLoading(true)

    try {
      const { ethers } = await import('ethers')
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const contract = new ethers.Contract(
        contractAddress as string,
        SatisfactionSurveyABI.abi,
        provider
      )

      // Collect all handles
      const handleMap: Record<string, string[]> = {}
      const isValidHandle = (handle: string): boolean => {
        return !!(handle &&
          handle.startsWith('0x') &&
          handle.length === 66 &&
          handle !== '0x0000000000000000000000000000000000000000000000000000000000000000' &&
          /^0x[0-9a-fA-F]{64}$/.test(handle))
      }

      // Read global aggregates
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

      // Read department aggregates
      for (let i = 0; i < DEPARTMENTS.length; i++) {
        const deptAggResult = await contract.getDepartmentAggregates(BigInt(i))
        const deptTotalHandle = String(deptAggResult[0])
        const deptCountHandle = String(deptAggResult[1])

        if (isValidHandle(deptTotalHandle)) {
          if (!handleMap[deptTotalHandle]) handleMap[deptTotalHandle] = []
          handleMap[deptTotalHandle].push(`dept${i}Total`)
        }
        if (isValidHandle(deptCountHandle)) {
          if (!handleMap[deptCountHandle]) handleMap[deptCountHandle] = []
          handleMap[deptCountHandle].push(`dept${i}Count`)
        }
      }

      const uniqueHandles = Object.keys(handleMap)
      if (uniqueHandles.length === 0) {
        setGlobalTotal(0n)
        setGlobalCount(0n)
        setDeptData(DEPARTMENTS.map(() => ({ total: 0n, count: 0n })))
        return
      }

      // Batch decrypt
      const results = await fhe.decryptMultiple(
        uniqueHandles.map(h => ({ handle: h, contractAddress: contractAddress as string })),
        address as string
      )

      if (!results || typeof results !== 'object') {
        return
      }

      // Apply results
      const newDeptData = DEPARTMENTS.map(() => ({ total: 0n, count: 0n }))

      for (const [handle, types] of Object.entries(handleMap)) {
        const value = results[handle]
        if (value !== undefined && value !== null) {
          for (const type of types) {
            const bigValue = BigInt(value)
            if (type === 'globalTotal') setGlobalTotal(bigValue)
            else if (type === 'globalCount') setGlobalCount(bigValue)
            else if (type.startsWith('dept')) {
              const match = type.match(/dept(\d+)(Total|Count)/)
              if (match) {
                const deptIndex = parseInt(match[1])
                const field = match[2].toLowerCase() as 'total' | 'count'
                newDeptData[deptIndex][field] = bigValue
              }
            }
          }
        }
      }

      setDeptData(newDeptData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error)
    } finally {
      isDecryptingRef.current = false
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [deployed, contractAddress, fhe.isReady, address, chainId])

  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12">
        <StaggerContainer>
          {/* Header */}
          <StaggerItem>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  <span className="gradient-text">Data Dashboard</span>
                </h1>
                <p className="text-muted-foreground">
                  View decrypted aggregate statistics in real-time
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchData}
                disabled={isLoading || !fhe.isReady}
                className="mt-4 md:mt-0 px-4 py-2 rounded-xl border border-border bg-card/50 hover:bg-card flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh Data
              </motion.button>
            </div>
          </StaggerItem>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StaggerItem>
              <StatCard
                title="Global Average"
                value={globalAverage.toFixed(2)}
                icon={TrendingUp}
                color="primary"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Total Responses"
                value={totalResponses}
                icon={Users}
                color="secondary"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Departments"
                value={DEPARTMENTS.length}
                icon={Building2}
                color="accent"
              />
            </StaggerItem>
            <StaggerItem>
              <StatCard
                title="Top Department"
                value={highestDept}
                icon={Award}
                color="primary"
              />
            </StaggerItem>
          </div>

          {/* Global Score Gauge */}
          <StaggerItem>
            <Card className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Global Satisfaction</h2>
              </div>
              <div className="flex flex-col items-center">
                <div className="relative w-48 h-48">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="96"
                      cy="96"
                      r="80"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: '0 502' }}
                      animate={{ 
                        strokeDasharray: `${(globalAverage / 10) * 502} 502` 
                      }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" />
                        <stop offset="100%" stopColor="hsl(var(--secondary))" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`text-5xl font-bold ${getScoreColor(globalAverage)}`}
                    >
                      {globalAverage.toFixed(1)}
                    </motion.span>
                    <span className="text-muted-foreground text-sm">/ 10</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <span className={`text-lg font-semibold ${getScoreColor(globalAverage)}`}>
                    {getScoreLabel(globalAverage)}
                  </span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Based on {totalResponses} responses
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Department Breakdown */}
          <StaggerItem>
            <Card className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Department Analysis</h2>
              </div>
              <div className="space-y-6">
                {DEPARTMENTS.map((dept, index) => {
                  const data = deptData[index]
                  const avg = data.count > 0n 
                    ? Number(data.total) / Number(data.count) 
                    : 0
                  const percentage = (avg / 10) * 100

                  return (
                    <motion.div
                      key={dept.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{dept.icon}</span>
                          <span className="font-medium">{dept.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">
                            {Number(data.count)} responses
                          </span>
                          <span className={`font-bold ${getScoreColor(avg)}`}>
                            {avg.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 }}
                          className={`h-full rounded-full ${dept.color}`}
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </StaggerItem>

          {/* Department Cards Grid */}
          <StaggerItem>
            <h2 className="text-lg font-semibold mb-4">Department Details</h2>
          </StaggerItem>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEPARTMENTS.map((dept, index) => {
              const data = deptData[index]
              const avg = data.count > 0n 
                ? Number(data.total) / Number(data.count) 
                : 0

              return (
                <StaggerItem key={dept.id}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${dept.color} flex items-center justify-center text-xl`}>
                        {dept.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{dept.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {Number(data.count)} responses
                        </p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Average</p>
                        <p className={`text-3xl font-bold ${getScoreColor(avg)}`}>
                          {avg.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-lg font-semibold">
                          {data.total.toString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </div>

          {/* Last Updated */}
          {lastUpdated && (
            <StaggerItem>
              <p className="text-center text-sm text-muted-foreground mt-8">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            </StaggerItem>
          )}
        </StaggerContainer>
      </div>
    </PageTransition>
  )
}
