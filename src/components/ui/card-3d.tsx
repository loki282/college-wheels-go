import React, { useRef, useState, MouseEvent, TouchEvent } from 'react';
import { cn } from "@/lib/utils";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: "primary" | "accent";
}

export function Card3D({
  children,
  className,
  intensity = 10,
  glowColor = "primary"
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMove = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const angleY = ((clientX - centerX) / (rect.width / 2)) * intensity;
    const angleX = ((centerY - clientY) / (rect.height / 2)) * intensity;

    setRotateX(angleX);
    setRotateY(angleY);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative perspective-1000 transform-gpu transition-all duration-300",
        glowColor === "primary" && isHovered && "after:absolute after:inset-0 after:-z-10 after:rounded-2xl after:opacity-70 after:blur-xl after:bg-cosmicviolet/25",
        glowColor === "accent" && isHovered && "after:absolute after:inset-0 after:-z-10 after:rounded-2xl after:opacity-70 after:blur-xl after:bg-nebulagreen/25",
        className
      )}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      style={{
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d"
      }}
    >
      {children}
    </div>
  );
}
