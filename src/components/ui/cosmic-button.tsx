import React, { useState } from 'react';
import { cn } from "@/lib/utils";

interface CosmicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "outline" | "ghost";
    size?: "default" | "sm" | "lg";
    glow?: boolean;
    className?: string;
}

export function CosmicButton({
    children,
    variant = "default",
    size = "default",
    glow = true,
    className,
    ...props
}: CosmicButtonProps) {
    const [isActive, setIsActive] = useState(false);

    const handleTouchStart = () => {
        setIsActive(true);
    };

    const handleTouchEnd = () => {
        setIsActive(false);
    };

    return (
        <button
            className={cn(
                "relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                // Size variants
                size === "default" && "h-10 px-4 py-2",
                size === "sm" && "h-8 px-3 text-sm",
                size === "lg" && "h-12 px-6 text-lg",
                // Variant styles
                variant === "default" && "bg-cosmicviolet text-white hover:bg-cosmicviolet/90 active:scale-95",
                variant === "outline" && "border-2 border-cosmicviolet text-cosmicviolet hover:bg-cosmicviolet/10 active:scale-95",
                variant === "ghost" && "text-cosmicviolet hover:bg-cosmicviolet/10 active:scale-95",
                // Glow effect
                glow && "after:absolute after:inset-0 after:-z-10 after:rounded-lg after:opacity-0 after:blur-xl after:transition-opacity after:duration-200 hover:after:opacity-70 after:bg-cosmicviolet/25",
                // Active state for touch devices
                isActive && "scale-95",
                className
            )}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            {...props}
        >
            {children}
        </button>
    );
} 