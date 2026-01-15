import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Removed framer-motion for instant page loads
const PageTransition = ({ children }: PageTransitionProps) => {
  return <>{children}</>;
};

export default PageTransition;
