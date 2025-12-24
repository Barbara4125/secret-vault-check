import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import Home from './pages/Home'
import Survey from './pages/Survey'
import Dashboard from './pages/Dashboard'
import Decrypt from './pages/Decrypt'
import { Toaster } from './components/ui/toaster'

function AnimatedRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="survey" element={<Survey />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="decrypt" element={<Decrypt />} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
      <Toaster />
    </Router>
  )
}

export default App
