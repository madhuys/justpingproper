import * as React from "react";
import { MoreHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NodeHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between px-3 py-2",
      className
    )}
    {...props}
  >
    {children}
  </div>
));
NodeHeader.displayName = "NodeHeader";

const NodeHeaderTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex-1 text-sm font-medium", className)}
    {...props}
  />
));
NodeHeaderTitle.displayName = "NodeHeaderTitle";

const NodeHeaderIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mr-2 h-4 w-4", className)}
    {...props}
  >
    {children}
  </div>
));
NodeHeaderIcon.displayName = "NodeHeaderIcon";

const NodeHeaderActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("ml-2 flex items-center gap-1", className)}
    {...props}
  />
));
NodeHeaderActions.displayName = "NodeHeaderActions";

interface NodeHeaderMenuActionProps {
  label?: string;
  children: React.ReactNode;
}

const NodeHeaderMenuAction = React.forwardRef<
  HTMLButtonElement,
  NodeHeaderMenuActionProps
>(({ label = "Open menu", children }, ref) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button
        ref={ref}
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        aria-label={label}
      >
        <MoreHorizontal className="h-3 w-3" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-48">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
));
NodeHeaderMenuAction.displayName = "NodeHeaderMenuAction";

interface NodeHeaderDeleteActionProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onDelete?: () => void;
}

const NodeHeaderDeleteAction = React.forwardRef<
  HTMLButtonElement,
  NodeHeaderDeleteActionProps
>(({ className, onDelete, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="icon"
    className={cn("h-6 w-6", className)}
    onClick={onDelete}
    aria-label="Delete node"
    {...props}
  >
    <X className="h-3 w-3" />
  </Button>
));
NodeHeaderDeleteAction.displayName = "NodeHeaderDeleteAction";

export {
  NodeHeader,
  NodeHeaderTitle,
  NodeHeaderIcon,
  NodeHeaderActions,
  NodeHeaderMenuAction,
  NodeHeaderDeleteAction,
};