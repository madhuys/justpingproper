# JustPing Implementation Guide

## 🚀 Quick Start Implementation

### Step 1: Frontend Setup (Next.js)

```bash
# Create frontend project
cd c:\Users\madhu\Downloads\
npx create-next-app@latest justping-frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd justping-frontend

# Install core dependencies
npm install @tanstack/react-query axios firebase socket.io-client zustand
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react react-hot-toast next-themes
npm install recharts @tremor/react
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
npm install @radix-ui/react-toast @radix-ui/react-sheet

# Install UI library (shadcn/ui)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input card table badge avatar dialog dropdown-menu tabs sheet toast
```

### Step 2: Backend API Enhancement

Let's enhance your existing backend with additional API endpoints and middleware:

```javascript
// Add to your existing backend - New middleware for API versioning
// routers/api-v1.js
const express = require('express');
const router = express.Router();

// Import your existing routes
const agentsRoutes = require('../api/Agents/route');
const contactsRoutes = require('../api/Contacts/route');
const broadcastsRoutes = require('../api/Broadcast/route');
const conversationFlowRoutes = require('../api/ConversationFlow/route');

// API v1 routes
router.use('/agents', agentsRoutes);
router.use('/contacts', contactsRoutes);
router.use('/broadcasts', broadcastsRoutes);
router.use('/conversation-flows', conversationFlowRoutes);

module.exports = router;
```

### Step 3: Database Configuration

```javascript
// system/config/database.js - Enhanced database config
const knex = require('knex');
const knexConfig = require('../../knexfile');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Connection pool configuration
const db = knex({
  ...config,
  pool: {
    min: 2,
    max: 10,
    createTimeoutMillis: 3000,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100,
  }
});

module.exports = db;
```

## 🔧 Configuration Files

### Frontend Configuration

```typescript
// justping-frontend/src/lib/config/env.ts
export const config = {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000',
  FIREBASE_CONFIG: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
};
```

```typescript
// justping-frontend/src/lib/api/client.ts
import axios from 'axios';
import { config } from '../config/env';

const apiClient = axios.create({
  baseURL: `${config.API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Backend Enhancements

```javascript
// Add to your app.js - Enhanced CORS and security
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// API versioning
app.use('/api/v1', require('./routers/api-v1'));
```

## 📱 Frontend Components

### Theme Provider (Dark/Light Mode)
```typescript
// justping-frontend/src/components/providers/theme-provider.tsx
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### Theme Toggle Component
```typescript
// justping-frontend/src/components/ui/theme-toggle.tsx
'use client';
import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Header Component with Theme Toggle
```typescript
// justping-frontend/src/components/navigation/header.tsx
'use client';
import { Bell, Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAuth } from '@/components/providers/auth-provider';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Search */}
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations, contacts..."
              className="pl-8"
            />
          </div>
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

### Atomic Design Examples

#### Atom - Status Indicator
```typescript
// justping-frontend/src/components/atoms/status-indicator.tsx
import { cn } from '@/lib/utils';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'away' | 'busy';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StatusIndicator({ status, size = 'md', className }: StatusIndicatorProps) {
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
        className
      )}
      aria-label={`Status: ${status}`}
    />
  );
}
```

#### Molecule - User Avatar with Status
```typescript
// justping-frontend/src/components/molecules/user-avatar.tsx
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
          className="absolute -bottom-0.5 -right-0.5 border-2 border-background"
        />
      )}
    </div>
  );
}
```

### Authentication Provider
```typescript
// justping-frontend/src/components/providers/auth-provider.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/auth/firebase';
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    // Implementation
  };

  const logout = async () => {
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### API Hooks
```typescript
// justping-frontend/src/lib/hooks/use-agents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api/client';

export interface Agent {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const useAgents = () => {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const response = await apiClient.get('/agents');
      return response.data;
    },
  });
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post('/agents', agent);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...agent }: Partial<Agent> & { id: string }) => {
      const response = await apiClient.put(`/agents/${id}`, agent);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};
```

## 🗄️ Database Migrations Enhancement

```javascript
// migrations/knex/20250619000000_add_api_keys_table.js
exports.up = function(knex) {
  return knex.schema.createTable('api_keys', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('key_hash').notNullable();
    table.string('key_prefix').notNullable();
    table.json('permissions').defaultTo('[]');
    table.timestamp('expires_at');
    table.timestamp('last_used_at');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    table.index(['business_id']);
    table.index(['key_hash']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('api_keys');
};
```

```javascript
// migrations/knex/20250619000001_add_webhook_endpoints_table.js
exports.up = function(knex) {
  return knex.schema.createTable('webhook_endpoints', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('business_id').references('id').inTable('businesses').onDelete('CASCADE');
    table.string('url').notNullable();
    table.json('events').defaultTo('[]');
    table.string('secret').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.integer('retry_count').defaultTo(3);
    table.timestamp('last_triggered_at');
    table.timestamps(true, true);
    
    table.index(['business_id']);
    table.index(['is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('webhook_endpoints');
};
```

## 🔄 Real-time Implementation

### WebSocket Server (Backend)
```javascript
// system/services/websocket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3001',
        credentials: true,
      },
    });

    this.setupAuthentication();
    this.setupNamespaces();
  }

  setupAuthentication() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.businessId = decoded.businessId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupNamespaces() {
    // Conversations namespace
    const conversationsNs = this.io.of('/conversations');
    conversationsNs.on('connection', (socket) => {
      socket.join(`business:${socket.businessId}`);
      
      socket.on('join:conversation', (conversationId) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('message:send', async (data) => {
        // Process message and broadcast to conversation participants
        conversationsNs.to(`conversation:${data.conversationId}`)
          .emit('message:new', data);
      });

      socket.on('typing:start', (conversationId) => {
        socket.to(`conversation:${conversationId}`)
          .emit('typing:start', { userId: socket.userId });
      });

      socket.on('typing:stop', (conversationId) => {
        socket.to(`conversation:${conversationId}`)
          .emit('typing:stop', { userId: socket.userId });
      });
    });

    // Agents namespace
    const agentsNs = this.io.of('/agents');
    agentsNs.on('connection', (socket) => {
      socket.join(`business:${socket.businessId}`);
      
      socket.on('agent:status', (data) => {
        agentsNs.to(`business:${socket.businessId}`)
          .emit('agent:status', data);
      });
    });
  }

  // Broadcast to specific business
  broadcastToBusiness(businessId, event, data) {
    this.io.to(`business:${businessId}`).emit(event, data);
  }

  // Broadcast to conversation participants
  broadcastToConversation(conversationId, event, data) {
    this.io.of('/conversations')
      .to(`conversation:${conversationId}`)
      .emit(event, data);
  }
}

module.exports = WebSocketService;
```

### WebSocket Client (Frontend)
```typescript
// justping-frontend/src/lib/hooks/use-socket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/components/providers/auth-provider';

export const useSocket = (namespace: string = '') => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user) return;

    const token = user.accessToken;
    const socket = io(`${process.env.NEXT_PUBLIC_WS_URL}${namespace}`, {
      auth: { token },
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user, namespace]);

  const emit = (event: string, data: any) => {
    socketRef.current?.emit(event, data);
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    socketRef.current?.on(event, callback);
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    socketRef.current?.off(event, callback);
  };

  return { socket: socketRef.current, isConnected, emit, on, off };
};
```

## 🚀 Docker Configuration

### Frontend Dockerfile
```dockerfile
# justping-frontend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose for Development
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./justping-frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000
      - NEXT_PUBLIC_WS_URL=ws://backend:3000
    volumes:
      - ./justping-frontend:/app
      - /app/node_modules
    depends_on:
      - backend

  backend:
    build:
      context: ./justping-backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://justping:password@postgres:5432/justping
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-secret-key
    volumes:
      - ./justping-backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=justping
      - POSTGRES_USER=justping
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./justping-backend/migrations:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 🚀 Deployment Scripts

### Production Deployment Script
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting JustPing deployment..."

# Build and deploy frontend
echo "📦 Building frontend..."
cd justping-frontend
npm run build
npm run export

# Deploy to CDN (example with Vercel)
npx vercel --prod

# Build and deploy backend
echo "🔧 Building backend..."
cd ../justping-backend
docker build -t justping-backend:latest .

# Deploy to container registry
docker tag justping-backend:latest your-registry/justping-backend:latest
docker push your-registry/justping-backend:latest

# Update Kubernetes deployment
kubectl set image deployment/justping-backend justping-backend=your-registry/justping-backend:latest

echo "✅ Deployment completed!"
```

This implementation guide provides you with everything needed to build a production-ready full-stack application. The architecture is designed to scale with your business needs while maintaining the modular structure you've already established.
