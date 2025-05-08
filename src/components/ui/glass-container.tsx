
import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface GlassContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  intensity?: "light" | "medium" | "heavy";
  animation?: "none" | "float" | "pulse" | "orbit";
}

export function GlassContainer({ 
  children, 
  className,
  intensity = "medium",
  animation = "none",
  ...props
}: GlassContainerProps) {
  return (
    <div 
      className={cn(
        "rounded-2xl border shadow-sm backdrop-blur",
        intensity === "light" && "bg-white/40 border-white/20 dark:bg-deepcosmos/40 dark:border-white/5",
        intensity === "medium" && "bg-white/30 border-white/20 dark:bg-deepcosmos/30 dark:border-white/5",
        intensity === "heavy" && "bg-white/20 border-white/10 dark:bg-deepcosmos/20 dark:border-white/5",
        animation === "float" && "animate-float",
        animation === "pulse" && "animate-pulse-glow",
        animation === "orbit" && "animate-orbit",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
