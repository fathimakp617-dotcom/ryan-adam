import { useRef, useMemo, useState, useEffect, memo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

// Check for reduced motion preference and mobile devices
const prefersReducedMotion = typeof window !== "undefined" 
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches 
  : false;

const isMobile = typeof window !== "undefined"
  ? window.innerWidth < 768
  : false;

const ParticleField = memo(() => {
  const ref = useRef<THREE.Points>(null);

  // Minimal particle count for performance
  const particles = useMemo(() => {
    const count = 400; // Reduced from 800
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return positions;
  }, []);

  useFrame((state) => {
    if (ref.current && !prefersReducedMotion) {
      ref.current.rotation.x = state.clock.elapsedTime * 0.01;
      ref.current.rotation.y = state.clock.elapsedTime * 0.015;
    }
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled>
      <PointMaterial
        transparent
        color="#a87c39"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
});

ParticleField.displayName = "ParticleField";

const FloatingParticles = memo(() => {
  const [shouldRender, setShouldRender] = useState(false);

  // Defer 3D rendering significantly
  useEffect(() => {
    // Skip entirely on mobile or reduced motion preference
    if (prefersReducedMotion || isMobile) return;

    const timer = setTimeout(() => setShouldRender(true), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 75 }}
        dpr={1} // Force 1x pixel ratio for performance
        performance={{ min: 0.3 }}
        frameloop="demand" // Only render when needed
      >
        <ParticleField />
      </Canvas>
    </div>
  );
});

FloatingParticles.displayName = "FloatingParticles";

export default FloatingParticles;
