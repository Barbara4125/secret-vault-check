import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  glow?: boolean
  gradient?: boolean
}

export default function Card({ 
  children, 
  className = '', 
  hover = false,
  glow = false,
  gradient = false,
}: CardProps) {
  const baseClasses = 'rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6'
  const hoverClasses = hover ? 'card-hover cursor-pointer' : ''
  const glowClasses = glow ? 'glow-primary' : ''
  const gradientClasses = gradient ? 'gradient-border' : ''

  return (
    <motion.div
      whileHover={hover ? { scale: 1.02 } : undefined}
      className={`${baseClasses} ${hoverClasses} ${glowClasses} ${gradientClasses} ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 ${className}`}>
      {children}
    </div>
  )
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'primary' 
}: { 
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: { value: number; positive: boolean }
  color?: 'primary' | 'secondary' | 'accent'
}) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    secondary: 'from-secondary/20 to-secondary/5 text-secondary',
    accent: 'from-accent/20 to-accent/5 text-accent',
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-6 card-hover"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  )
}
