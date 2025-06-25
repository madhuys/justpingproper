"use client"

import * as React from "react"
import { Check, ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { focusStyles, glassmorphicInputStyles } from "@/lib/focus-styles"

interface ComboboxOption {
  value: string
  label: string
}

interface ComboboxProps {
  options?: ComboboxOption[]
  value?: string
  onChange?: (value: string) => void
  onOpenChange?: (open: boolean) => void
  open?: boolean
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  size?: "sm" | "default"
  className?: string
  children?: React.ReactNode
}

export function Combobox({
  options = [],
  value,
  onChange,
  onOpenChange,
  open: controlledOpen,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  disabled = false,
  size = "default",
  className,
  children,
}: ComboboxProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  const selectedOption = options.find((option) => option.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          data-slot="select-trigger"
          data-size={size}
          data-placeholder={!value}
          disabled={disabled}
          className={cn(
            "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground flex w-fit items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
            glassmorphicInputStyles,
            focusStyles,
            className
          )}
        >
          <span data-slot="select-value">
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDownIcon className="size-4 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "bg-popover/95 backdrop-blur-md text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-[var(--radix-popper-available-height)] min-w-[8rem] origin-[var(--radix-popper-transform-origin)] overflow-x-hidden overflow-y-auto rounded-md border border-white/20 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-black/30",
          "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none before:rounded-md",
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          "p-0 w-[var(--radix-popover-trigger-width)]"
        )}
        align="start"
        sideOffset={0}
        data-slot="select-content"
        onOpenAutoFocus={(e) => {
          // Let the command input receive focus
        }}
      >
        <Command 
          shouldFilter={true}
          filter={(value, search) => {
            const label = options.find(opt => opt.value === value)?.label || value
            if (label.toLowerCase().startsWith(search.toLowerCase())) return 1
            return 0
          }}
          loop
        >
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9 border-0 border-b border-border/20 bg-transparent focus:ring-0 focus:outline-none rounded-none"
            autoFocus
          />
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
            {emptyText}
          </CommandEmpty>
          <CommandList className="max-h-[300px] overflow-y-auto p-1 scroll-my-1">
            {children || (
              <CommandGroup className="overflow-hidden">
                {options.map((option) => (
                  <ComboboxItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange?.(option.value)
                      setOpen(false)
                    }}
                    selected={value === option.value}
                  >
                    {option.label}
                  </ComboboxItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

interface ComboboxItemProps {
  value: string
  onSelect?: () => void
  selected?: boolean
  children: React.ReactNode
  className?: string
}

export function ComboboxItem({
  value,
  onSelect,
  selected,
  children,
  className,
}: ComboboxItemProps) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      data-slot="select-item"
      className={cn(
        "dropdown-item",
        "[&_svg:not([class*='text-'])]:text-muted-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        {selected && <Check className="size-4" />}
      </span>
      {children}
    </CommandItem>
  )
}

export function ComboboxGroup({
  children,
  ...props
}: React.ComponentProps<typeof CommandGroup>) {
  return (
    <CommandGroup data-slot="select-group" {...props}>
      {children}
    </CommandGroup>
  )
}

export function ComboboxLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  )
}

export function ComboboxSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  )
}