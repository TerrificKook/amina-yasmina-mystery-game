const particleSeed = Array.from({ length: 34 }, (_, index) => ({
  left: (index * 29 + 11) % 100,
  top: (index * 47 + 17) % 100,
  size: 3 + (index % 4),
  delay: (index % 9) * 0.42,
  duration: 4.5 + (index % 5) * 0.55,
}));

export default function Particles({ dense = false }) {
  const particles = dense ? particleSeed : particleSeed.slice(0, 22);

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((particle, index) => (
        <span
          key={index}
          style={{
            '--left': `${particle.left}%`,
            '--top': `${particle.top}%`,
            '--size': `${particle.size}px`,
            '--delay': `${particle.delay}s`,
            '--duration': `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
