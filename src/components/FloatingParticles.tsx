import { memo } from "react";

// Completely disabled for performance - the 3D particles were causing
// WebGL context loss and significant performance degradation
const FloatingParticles = memo(() => {
  return null;
});

FloatingParticles.displayName = "FloatingParticles";

export default FloatingParticles;