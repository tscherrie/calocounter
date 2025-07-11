import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "light" | "medium" | "heavy";
  animated?: boolean;
}

const Glass = forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = "medium", animated = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass styles
          "relative overflow-hidden rounded-2xl border backdrop-blur-xl",
          
          // Variant styles
          {
            "bg-white/5 border-white/10 shadow-glass-sm": variant === "light",
            "bg-white/10 border-white/20 shadow-glass": variant === "medium", 
            "bg-white/15 border-white/25 shadow-glass": variant === "heavy",
          },
          
          // Animation
          {
            "transition-all duration-300 hover:shadow-glass-lg hover:bg-white/15": animated,
          },
          
          className
        )}
        {...props}
      >
        {/* Glass overlay effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">
          {props.children}
        </div>
      </div>
    );
  }
);

Glass.displayName = "Glass";

export { Glass }; 