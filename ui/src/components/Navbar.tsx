import { NavLink, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Home, ClipboardList, BarChart3, Unlock, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/survey', label: 'Survey', icon: ClipboardList },
  { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { path: '/decrypt', label: 'Decrypt', icon: Unlock },
]

export default function Navbar() {
  const location = useLocation()

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </motion.div>
            <span className="text-xl font-bold gradient-text hidden sm:block">
              FHE Survey
            </span>
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 rounded-lg transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute inset-0 bg-primary/20 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative flex items-center gap-2 text-sm font-medium ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </nav>

          {/* Mobile Navigation */}
          <nav className="flex md:hidden items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`p-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </NavLink>
              )
            })}
          </nav>

          {/* Wallet Connect */}
          <div className="flex items-center">
            <ConnectButton 
              chainStatus="icon" 
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>
    </motion.header>
  )
}
