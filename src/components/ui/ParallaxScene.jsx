import { useState } from 'react';
import Particles from './Particles.jsx';

export default function ParallaxScene({ type, children, finale = false }) {
  const [shift, setShift] = useState({ x: 0, y: 0 });

  const handlePointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    setShift({ x: Number((x * 18).toFixed(2)), y: Number((y * 12).toFixed(2)) });
  };

  return (
    <main
      className={`parallax scene-${type} ${finale ? 'scene-finale' : ''}`}
      style={{ '--mx': `${shift.x}px`, '--my': `${shift.y}px` }}
      onPointerMove={handlePointerMove}
    >
      <div className="scene-layer sky-layer" aria-hidden="true" />
      <div className="scene-layer far-layer" aria-hidden="true" />
      <div className="scene-layer mid-layer" aria-hidden="true" />
      <div className="scene-layer near-layer" aria-hidden="true" />
      <div className="moon" aria-hidden="true" />
      <Particles dense={type === 'lake' || finale} />
      <div className="scene-content">{children}</div>
    </main>
  );
}
