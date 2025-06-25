# JustPing Frontend Component Architecture Guide

## 🎨 Atomic Design System with shadcn/ui

### Component Hierarchy

```
components/
├── ui/                     # shadcn/ui Base Components
├── atoms/                  # Custom Atomic Components  
├── molecules/              # Compound Components
├── organisms/              # Complex Components
├── navigation/             # Navigation Organisms Only
└── providers/              # Context Providers
```

## 🧩 shadcn/ui Components (Base Layer)

### Installation Commands
```bash
# Core UI components
npx shadcn-ui@latest add button input card table badge avatar
npx shadcn-ui@latest add dialog dropdown-menu tabs sheet toast
npx shadcn-ui@latest add form label textarea select checkbox
npx shadcn-ui@latest add alert-dialog command popover calendar
npx shadcn-ui@latest add progress slider switch toggle

# Data display
npx shadcn-ui@latest add data-table pagination skeleton
npx shadcn-ui@latest add accordion collapsible separator

# Navigation  
npx shadcn-ui@latest add navigation-menu breadcrumb

# Feedback
npx shadcn-ui@latest add alert toast tooltip
```

### Usage Examples
```typescript
// Using shadcn button
import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Primary Action
</Button>

// Using shadcn card
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Agent Performance</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

## ⚛️ Atoms (Custom Components)

### 1. Loading Spinner
```typescript
// src/components/atoms/loading-spinner.tsx
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      aria-label="Loading"
    />
  );
}
```

### 2. Status Indicator
```typescript
// src/components/atoms/status-indicator.tsx
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  size = 'md', 
  showPulse = false,
  className 
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4',
  };

  const statusClasses = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  return (
    <div
      className={cn(
        'rounded-full',
        sizeClasses[size],
        statusClasses[status],
        showPulse && status === 'online' && 'animate-pulse',
        className
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
```

### 3. Empty State
```typescript
// src/components/atoms/empty-state.tsx
import { FileX } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ 
  icon: Icon = FileX, 
  title, 
  description, 
  action 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}
```

## 🧬 Molecules (Compound Components)

### 1. Search Bar
```typescript
// src/components/molecules/search-bar.tsx
'use client';
import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchBar({ placeholder = 'Search...', onSearch, className }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-9"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </form>
  );
}
```

### 2. User Avatar with Status
```typescript
// src/components/molecules/user-avatar.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StatusIndicator } from '@/components/atoms/status-indicator';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  src?: string;
  name: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export function UserAvatar({ 
  src, 
  name, 
  status = 'offline', 
  size = 'md', 
  showStatus = true,
  className 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10', 
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('relative', className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={src} alt={name} />
        <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
      </Avatar>
      {showStatus && (
        <StatusIndicator
          status={status}
          size={size === 'lg' ? 'md' : 'sm'}
          showPulse
          className="absolute -bottom-0.5 -right-0.5 border-2 border-background"
        />
      )}
    </div>
  );
}
```

### 3. Metric Card
```typescript
// src/components/molecules/metric-card.tsx
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  className 
}: MetricCardProps) {
  const changeIcon = {
    increase: TrendingUp,
    decrease: TrendingDown,
    neutral: Minus,
  };

  const changeColor = {
    increase: 'text-green-600',
    decrease: 'text-red-600', 
    neutral: 'text-muted-foreground',
  };

  const ChangeIcon = changeIcon[changeType];

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center text-sm', changeColor[changeType])}>
                <ChangeIcon className="h-3 w-3 mr-1" />
                {Math.abs(change)}%
              </div>
            )}
          </div>
          {Icon && (
            <Icon className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

## 🏗️ Organisms (Complex Components)

### Navigation Components (in navigation folder)

#### Header with Theme Toggle
```typescript
// src/components/navigation/header.tsx
'use client';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SearchBar } from '@/components/molecules/search-bar';
import { useAuth } from '@/components/providers/auth-provider';

export function Header() {
  const { user, logout } = useAuth();

  const handleSearch = (query: string) => {
    console.log('Search:', query);
    // Implement search logic
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* Search */}
        <div className="flex flex-1 items-center space-x-2">
          <SearchBar
            placeholder="Search conversations, contacts..."
            onSearch={handleSearch}
            className="w-full max-w-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          {/* Notifications */}
          <Button variant="ghost" size="icon">
            <Bell className="h-4 w-4" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                  <AvatarFallback>{user?.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.displayName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
```

### Form Organisms

#### Agent Creation Form
```typescript
// src/components/organisms/forms/agent-form.tsx
'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { LoadingSpinner } from '@/components/atoms/loading-spinner';

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  isActive: z.boolean().default(true),
  welcomeMessage: z.string().min(1, 'Welcome message is required'),
});

type AgentFormData = z.infer<typeof agentSchema>;

interface AgentFormProps {
  onSubmit: (data: AgentFormData) => Promise<void>;
  initialData?: Partial<AgentFormData>;
  isLoading?: boolean;
}

export function AgentForm({ onSubmit, initialData, isLoading }: AgentFormProps) {
  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
      welcomeMessage: '',
      ...initialData,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent Name</FormLabel>
              <FormControl>
                <Input placeholder="Customer Support Agent" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe what this agent does..."
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="welcomeMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Welcome Message</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Hi! I'm here to help you with..."
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Agent</FormLabel>
                <FormDescription>
                  Enable this agent to respond to customer messages
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          {initialData ? 'Update Agent' : 'Create Agent'}
        </Button>
      </form>
    </Form>
  );
}
```

## 🎨 Theme Configuration

### Tailwind CSS Config
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 📁 Component File Structure

```
src/components/
├── ui/                           # shadcn/ui components
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── theme-toggle.tsx
│   └── ...
├── atoms/                        # Atomic components
│   ├── loading-spinner.tsx
│   ├── status-indicator.tsx
│   ├── empty-state.tsx
│   ├── file-icon.tsx
│   └── logo.tsx
├── molecules/                    # Molecular components
│   ├── search-bar.tsx
│   ├── user-avatar.tsx
│   ├── metric-card.tsx
│   ├── message-bubble.tsx
│   └── progress-bar.tsx
├── organisms/                    # Organism components
│   ├── forms/
│   │   ├── agent-form.tsx
│   │   ├── contact-form.tsx
│   │   └── broadcast-form.tsx
│   ├── lists/
│   │   ├── contact-list.tsx
│   │   ├── conversation-list.tsx
│   │   └── agent-list.tsx
│   ├── panels/
│   │   ├── chat-panel.tsx
│   │   └── analytics-panel.tsx
│   └── modals/
│       ├── create-agent-modal.tsx
│       └── import-contacts-modal.tsx
├── navigation/                   # Navigation organisms only
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── breadcrumb.tsx
│   └── footer.tsx
└── providers/                    # Context providers
    ├── auth-provider.tsx
    ├── theme-provider.tsx
    └── socket-provider.tsx
```

## 🎯 Development Guidelines

### 1. Component Naming
- Use PascalCase for component names
- Use descriptive names that indicate purpose
- Prefix custom atoms with business context when needed

### 2. Props Interface
- Always define TypeScript interfaces for props
- Use optional props with default values
- Include className for styling flexibility

### 3. Accessibility
- Include proper ARIA labels
- Support keyboard navigation
- Ensure color contrast meets WCAG standards

### 4. Testing
```typescript
// Component testing example
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { MetricCard } from '@/components/molecules/metric-card';

describe('MetricCard', () => {
  it('renders metric data correctly', () => {
    render(
      <ThemeProvider>
        <MetricCard 
          title="Total Conversations" 
          value="1,234" 
          change={12.5}
          changeType="increase"
        />
      </ThemeProvider>
    );
    
    expect(screen.getByText('Total Conversations')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
    expect(screen.getByText('12.5%')).toBeInTheDocument();
  });
});
```

This atomic design system with shadcn/ui provides a scalable, maintainable component architecture for your JustPing application with built-in dark/light mode support.
