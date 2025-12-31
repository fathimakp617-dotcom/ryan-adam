import { useRef, useMemo, lazy, Suspense, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

function ParticleField() {
  const ref = useRef<THREE.Points>(null);

  // Reduced particle count for better performance
  const particles = useMemo(() => {
    const count = 800; // Reduced from 2000
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current) {
      // Slower rotation for smoother performance
      ref.current.rotation.x = state.clock.elapsedTime * 0.015;
      ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#a87c39"
        size={0.025}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.5}
      />
    </Points>
  );
}

const FloatingParticles = () => {
  const [shouldRender, setShouldRender] = useState(false);

  // Defer 3D rendering to after initial page load
  useEffect(() => {
    const timer = requestIdleCallback 
      ? requestIdleCallback(() => setShouldRender(true))
      : setTimeout(() => setShouldRender(true), 100);
    
    return () => {
      if (requestIdleCallback && typeof timer === 'number') {
        cancelIdleCallback(timer);
      } else {
        clearTimeout(timer as unknown as number);
      }
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        performance={{ min: 0.5 }}
      >
        <ParticleField />
      </Canvas>
    </div>
  );
};

export default FloatingParticles;
