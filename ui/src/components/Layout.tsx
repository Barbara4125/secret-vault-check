import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import ParticleBackground from './ParticleBackground'

export default function Layout() {
  return (
    <div className="min-h-screen animated-bg relative">
      <ParticleBackground />
      <Navbar />
      <main className="relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
