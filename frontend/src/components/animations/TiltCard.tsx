import type { ReactNode, MouseEvent } from "react";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const prefersReduced =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  liftY?: number;
  onClick?: () => void;
}

export default function TiltCard({
  children,
  className,
  maxTilt = 8,
  liftY = 8,
  onClick,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const springConfig = { stiffness: 300, damping: 20 };
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-maxTilt, maxTilt]), springConfig);
  const translateY = useSpring(0, springConfig);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (prefersReduced || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    rawX.set(x * 2);
    rawY.set(y * 2);
    translateY.set(-liftY);
  }

  function handleMouseLeave() {
    rawX.set(0);
    rawY.set(0);
    translateY.set(0);
  }

  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        y: translateY,
        willChange: "transform",
        position: "relative",
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}
