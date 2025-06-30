import * as React from "react";
import { cn } from "@/lib/utils";

export interface BaseNodeProps extends React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

const BaseNode = React.forwardRef<HTMLDivElement, BaseNodeProps>(
  ({ className, selected, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border bg-card text-card-foreground shadow-sm",
          selected && "ring-2 ring-primary ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
BaseNode.displayName = "BaseNode";

export { BaseNode };