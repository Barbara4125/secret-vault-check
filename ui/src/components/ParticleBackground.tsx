import { useEffect, useState } from 'react'

interface Particle {
  id: number
  x: number
  delay: number
  duration: number
  size: number
}

export default function ParticleBackground() {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const newParticles: Particle[] = []
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 10,
        duration: 10 + Math.random() * 20,
        size: 2 + Math.random() * 4,
      })
    }
    setParticles(newParticles)
  }, [])

  return (
    <div className="particles">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="particle"
          style={{
            left: `${particle.x}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
