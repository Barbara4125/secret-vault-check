import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Lock, BarChart3, Sparkles, ArrowRight, CheckCircle } from 'lucide-react'
import PageTransition, { StaggerContainer, StaggerItem } from '../components/PageTransition'

const features = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Using Fully Homomorphic Encryption (FHE), your ratings remain encrypted throughout the entire process',
  },
  {
    icon: Shield,
    title: 'Complete Anonymity',
    description: 'Individual votes are never revealed, only aggregated results can be decrypted and viewed',
  },
  {
    icon: BarChart3,
    title: 'Real-time Statistics',
    description: 'View department and global satisfaction statistics with multi-dimensional analysis',
  },
  {
    icon: Sparkles,
    title: 'On-chain Verification',
    description: 'All data is stored on the blockchain, ensuring transparency and immutability',
  },
]

const steps = [
  { step: 1, title: 'Connect Wallet', description: 'Connect to a supported network using MetaMask' },
  { step: 2, title: 'Select Department', description: 'Choose your department for rating' },
  { step: 3, title: 'Submit Rating', description: 'Your rating will be encrypted and submitted on-chain' },
  { step: 4, title: 'View Results', description: 'Check aggregated statistics on the dashboard' },
]

export default function Home() {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center py-20">
          <StaggerContainer className="max-w-4xl mx-auto">
            <StaggerItem>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-8"
              >
                <Sparkles className="w-4 h-4" />
                Powered by Fully Homomorphic Encryption
              </motion.div>
            </StaggerItem>

            <StaggerItem>
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                <span className="gradient-text">Anonymous Employee</span>
                <br />
                <span className="text-foreground">Satisfaction Survey</span>
              </h1>
            </StaggerItem>

            <StaggerItem>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Protect your privacy with FHE encryption technology. Submit encrypted ratings and view decrypted aggregate statistics.
                Your individual answers are never revealed.
              </p>
            </StaggerItem>

            <StaggerItem>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/survey">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="btn-gradient px-8 py-4 rounded-xl text-white font-semibold flex items-center gap-2"
                  >
                    Start Survey
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
                <Link to="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 rounded-xl border border-border bg-card/50 hover:bg-card font-semibold flex items-center gap-2 transition-colors"
                  >
                    View Dashboard
                    <BarChart3 className="w-5 h-5" />
                  </motion.button>
                </Link>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <StaggerContainer>
            <StaggerItem>
              <h2 className="text-3xl font-bold text-center mb-4">Core Features</h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Using cutting-edge encryption technology to ensure maximum privacy protection
              </p>
            </StaggerItem>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <StaggerItem key={index}>
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm h-full"
                  >
                    <motion.div
                      initial={{ rotate: 0 }}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4"
                    >
                      <feature.icon className="w-6 h-6 text-white" />
                    </motion.div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </section>

        {/* How it works */}
        <section className="py-20">
          <StaggerContainer>
            <StaggerItem>
              <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Complete an anonymous survey in four simple steps
              </p>
            </StaggerItem>

            <div className="grid md:grid-cols-4 gap-6">
              {steps.map((item, index) => (
                <StaggerItem key={item.step}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="relative p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
                  >
                    <div className="absolute -top-4 left-6">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mt-4 mb-2">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.description}</p>
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                        <ArrowRight className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </motion.div>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20" />
            <div className="absolute inset-0 bg-card/80 backdrop-blur-xl" />
            <div className="relative p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Connect your wallet and start submitting your anonymous satisfaction rating
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Fully Anonymous
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  On-chain Verified
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Real-time Stats
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </PageTransition>
  )
}
