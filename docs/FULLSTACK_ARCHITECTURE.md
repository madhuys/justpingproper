# JustPing Full-Stack Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Mobile App (React Native)  │  Admin Panel │
│  - User Dashboard    │  - Native Mobile UI         │  - System    │
│  - Agent Management  │  - Push Notifications       │    Admin     │
│  - Chat Interface    │  - Offline Support          │  - Analytics │
│  - Campaign Builder  │  - Camera Integration       │  - Monitoring│
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer (Nginx/Cloudflare)                              │
│  - SSL Termination    - Rate Limiting    - DDoS Protection     │
│  - Caching           - Compression       - Request Routing     │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│                 Node.js Backend (Express.js)                   │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │    API      │   Agents    │  WhatsApp   │   Background    │  │
│  │ Controllers │    Flow     │ Integration │    Workers      │  │
│  │             │   System    │             │                 │  │
│  └─────────────┴─────────────┴─────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  Auth Service  │  AI Service   │  Message Queue │  File Storage │
│  (Firebase)    │  (OpenAI/     │  (Redis/       │  (Azure Blob) │
│                │   Custom AI)  │   RabbitMQ)    │               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Primary DB    │  Cache Layer  │  Search Engine │  Analytics DB │
│  (PostgreSQL)  │  (Redis)      │  (Elasticsearch│  (ClickHouse) │
│                │               │   /Algolia)    │               │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                 EXTERNAL INTEGRATIONS                          │
├─────────────────────────────────────────────────────────────────┤
│ WhatsApp API │ Payment Gateway │ Email Service │ SMS Provider   │
│ (Business)   │ (Stripe/Razor)  │ (SendGrid)    │ (Twilio)       │
└─────────────────────────────────────────────────────────────────┘
```

## 📱 Frontend Architecture (Next.js 14+)

### **Project Structure**
```
justping-frontend/
├── src/
│   ├── app/                         # App Router
│   │   ├── (auth)/                  # Route Groups
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/             # Protected Routes
│   │   │   ├── dashboard/           # Main Dashboard
│   │   │   ├── agents/              # AI Agent Management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   ├── [id]/
│   │   │   │   └── flows/           # Conversation Flows
│   │   │   ├── contacts/            # Contact Management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── groups/
│   │   │   │   ├── import/
│   │   │   │   └── segments/
│   │   │   ├── conversations/       # Chat Interface
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   └── inbox/
│   │   │   ├── broadcasts/          # Campaign Management
│   │   │   │   ├── page.tsx
│   │   │   │   ├── create/
│   │   │   │   ├── templates/
│   │   │   │   └── analytics/
│   │   │   ├── team/               # Team Management
│   │   │   │   ├── members/
│   │   │   │   ├── roles/
│   │   │   │   └── invitations/
│   │   │   ├── channels/           # Channel Setup
│   │   │   │   ├── whatsapp/
│   │   │   │   ├── sms/
│   │   │   │   └── email/
│   │   │   ├── analytics/          # Reports & Analytics
│   │   │   │   ├── overview/
│   │   │   │   ├── campaigns/
│   │   │   │   └── agents/
│   │   │   └── settings/           # Business Settings
│   │   │       ├── profile/
│   │   │       ├── billing/
│   │   │       └── integrations/
│   │   ├── api/                    # API Routes (if needed)
│   │   │   ├── auth/
│   │   │   └── webhooks/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/                 # Atomic Design Components
│   │   ├── ui/                     # shadcn/ui Components (Base)
│   │   │   ├── button.tsx          # shadcn button
│   │   │   ├── input.tsx           # shadcn input
│   │   │   ├── card.tsx            # shadcn card
│   │   │   ├── dialog.tsx          # shadcn dialog
│   │   │   ├── dropdown-menu.tsx   # shadcn dropdown
│   │   │   ├── table.tsx           # shadcn table
│   │   │   ├── tabs.tsx            # shadcn tabs
│   │   │   ├── badge.tsx           # shadcn badge
│   │   │   ├── avatar.tsx          # shadcn avatar
│   │   │   ├── sheet.tsx           # shadcn sheet
│   │   │   ├── toast.tsx           # shadcn toast
│   │   │   └── theme-toggle.tsx    # Dark/Light mode toggle
│   │   ├── atoms/                  # Custom Atomic Components
│   │   │   ├── loading-spinner.tsx # Custom loading spinner
│   │   │   ├── status-indicator.tsx # Online/offline indicator
│   │   │   ├── file-icon.tsx       # File type icons
│   │   │   ├── logo.tsx            # Brand logo
│   │   │   ├── empty-state.tsx     # Empty state illustration
│   │   │   └── tooltip.tsx         # Custom tooltip
│   │   ├── molecules/              # Compound Components
│   │   │   ├── search-bar.tsx      # Search input with icon
│   │   │   ├── user-avatar.tsx     # Avatar with status
│   │   │   ├── message-bubble.tsx  # Chat message bubble
│   │   │   ├── file-upload.tsx     # File upload with preview
│   │   │   ├── data-table.tsx      # Table with sorting/filtering
│   │   │   ├── metric-card.tsx     # Dashboard stat card
│   │   │   ├── progress-bar.tsx    # Progress with percentage
│   │   │   └── date-picker.tsx     # Date range picker
│   │   ├── organisms/              # Complex Components
│   │   │   ├── forms/              # Form Organisms
│   │   │   │   ├── agent-form.tsx
│   │   │   │   ├── contact-form.tsx
│   │   │   │   ├── broadcast-form.tsx
│   │   │   │   ├── template-form.tsx
│   │   │   │   └── settings-form.tsx
│   │   │   ├── lists/              # List Organisms
│   │   │   │   ├── contact-list.tsx
│   │   │   │   ├── conversation-list.tsx
│   │   │   │   ├── agent-list.tsx
│   │   │   │   └── campaign-list.tsx
│   │   │   ├── panels/             # Panel Organisms
│   │   │   │   ├── chat-panel.tsx
│   │   │   │   ├── agent-panel.tsx
│   │   │   │   ├── analytics-panel.tsx
│   │   │   │   └── settings-panel.tsx
│   │   │   ├── modals/             # Modal Organisms
│   │   │   │   ├── create-agent-modal.tsx
│   │   │   │   ├── import-contacts-modal.tsx
│   │   │   │   ├── template-preview-modal.tsx
│   │   │   │   └── confirmation-modal.tsx
│   │   │   └── builders/           # Builder Organisms
│   │   │       ├── flow-builder.tsx
│   │   │       ├── template-builder.tsx
│   │   │       └── campaign-builder.tsx
│   │   ├── navigation/             # Navigation Organisms Only
│   │   │   ├── header.tsx          # Main header with theme toggle
│   │   │   ├── sidebar.tsx         # Navigation sidebar
│   │   │   ├── breadcrumb.tsx      # Breadcrumb navigation
│   │   │   ├── footer.tsx          # Application footer
│   │   │   └── mobile-nav.tsx      # Mobile navigation
│   │   └── providers/              # Context Providers
│   │       ├── auth-provider.tsx   # Authentication context
│   │       ├── theme-provider.tsx  # Dark/Light theme context
│   │       └── socket-provider.tsx # WebSocket context
│   ├── lib/                        # Utilities & Configuration
│   │   ├── api/                    # API Layer
│   │   │   ├── client.ts           # Base API client
│   │   │   ├── agents.ts           # Agent APIs
│   │   │   ├── contacts.ts         # Contact APIs
│   │   │   ├── broadcasts.ts       # Broadcast APIs
│   │   │   ├── conversations.ts    # Conversation APIs
│   │   │   ├── templates.ts        # Template APIs
│   │   │   ├── teams.ts            # Team APIs
│   │   │   ├── auth.ts             # Auth APIs
│   │   │   └── analytics.ts        # Analytics APIs
│   │   ├── auth/                   # Authentication
│   │   │   ├── firebase.ts         # Firebase config
│   │   │   ├── providers.ts        # Auth providers
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── utils/                  # Utility functions
│   │   │   ├── format.ts           # Data formatting
│   │   │   ├── validation.ts       # Form validation
│   │   │   ├── constants.ts        # App constants
│   │   │   ├── helpers.ts          # Helper functions
│   │   │   └── types.ts            # TypeScript types
│   │   ├── hooks/                  # Custom Hooks
│   │   │   ├── use-api.ts          # API hooks
│   │   │   ├── use-auth.ts         # Auth hooks
│   │   │   ├── use-socket.ts       # WebSocket hooks
│   │   │   ├── use-local-storage.ts
│   │   │   └── use-debounce.ts
│   │   ├── store/                  # State Management
│   │   │   ├── auth-store.ts       # Auth state
│   │   │   ├── ui-store.ts         # UI state
│   │   │   ├── chat-store.ts       # Chat state
│   │   │   └── agents-store.ts     # Agents state
│   │   └── config/                 # Configuration
│   │       ├── database.ts
│   │       ├── env.ts
│   │       └── app.ts
│   ├── styles/                     # Styling
│   │   ├── globals.css
│   │   ├── components.css
│   │   └── themes/
│   └── types/                      # TypeScript Definitions
│       ├── api.ts                  # API types
│       ├── user.ts                 # User types
│       ├── agent.ts                # Agent types
│       ├── conversation.ts         # Chat types
│       └── globals.ts              # Global types
├── public/                         # Static Assets
│   ├── images/
│   ├── icons/
│   ├── logos/
│   └── favicon.ico
├── docs/                          # Documentation
├── tests/                         # Testing
│   ├── __tests__/
│   ├── __mocks__/
│   └── setup.ts
├── .env.local                     # Environment variables
├── .env.example
├── next.config.js                 # Next.js config
├── tailwind.config.js             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── package.json
└── README.md
```

### **Technology Stack**
```json
{
  "framework": "Next.js 14+ with App Router",
  "language": "TypeScript",
  "styling": "Tailwind CSS + shadcn/ui",
  "design_system": "Atomic Design (Atoms → Molecules → Organisms)",
  "ui_library": "shadcn/ui (Radix UI + Tailwind)",
  "state_management": "Zustand + React Query",
  "authentication": "Firebase Auth",
  "real_time": "Socket.io Client", 
  "forms": "React Hook Form + Zod",
  "charts": "Recharts + Tremor",
  "theme": "next-themes (Dark/Light mode)",
  "icons": "Lucide React",
  "drag_drop": "React DnD",
  "notifications": "React Hot Toast + shadcn Toast",
  "testing": "Jest + Testing Library"
}
```

## 🔧 Backend Architecture (Your Current Structure)

### **Enhanced API Structure**
```
api/
├── v1/                            # API Versioning
│   ├── auth/                      # Authentication
│   │   ├── login
│   │   ├── register
│   │   ├── refresh-token
│   │   ├── logout
│   │   └── verify-email
│   ├── agents/                    # AI Agents
│   │   ├── GET /agents           # List agents
│   │   ├── POST /agents          # Create agent
│   │   ├── GET /agents/:id       # Get agent
│   │   ├── PUT /agents/:id       # Update agent
│   │   ├── DELETE /agents/:id    # Delete agent
│   │   ├── POST /agents/:id/test # Test agent
│   │   └── GET /agents/:id/flows # Get flows
│   ├── contacts/                  # Contact Management
│   │   ├── GET /contacts         # List contacts
│   │   ├── POST /contacts        # Create contact
│   │   ├── PUT /contacts/:id     # Update contact
│   │   ├── DELETE /contacts/:id  # Delete contact
│   │   ├── POST /contacts/import # Import contacts
│   │   ├── GET /contacts/groups  # List groups
│   │   └── POST /contacts/segment # Create segment
│   ├── conversations/             # Chat Management
│   │   ├── GET /conversations    # List conversations
│   │   ├── GET /conversations/:id # Get conversation
│   │   ├── POST /conversations/:id/messages # Send message
│   │   ├── PUT /conversations/:id/assign # Assign to agent
│   │   └── POST /conversations/:id/close # Close conversation
│   ├── broadcasts/                # Campaign Management
│   │   ├── GET /broadcasts       # List campaigns
│   │   ├── POST /broadcasts      # Create campaign
│   │   ├── GET /broadcasts/:id   # Get campaign
│   │   ├── PUT /broadcasts/:id   # Update campaign
│   │   ├── POST /broadcasts/:id/send # Send campaign
│   │   └── GET /broadcasts/:id/stats # Campaign stats
│   ├── templates/                 # Message Templates
│   │   ├── GET /templates        # List templates
│   │   ├── POST /templates       # Create template
│   │   ├── GET /templates/:id    # Get template
│   │   ├── PUT /templates/:id    # Update template
│   │   └── DELETE /templates/:id # Delete template
│   ├── teams/                     # Team Management
│   │   ├── GET /teams            # List teams
│   │   ├── POST /teams           # Create team
│   │   ├── GET /teams/:id/members # Get members
│   │   ├── POST /teams/:id/invite # Invite member
│   │   └── PUT /teams/:id/roles  # Update roles
│   ├── channels/                  # Channel Setup
│   │   ├── GET /channels         # List channels
│   │   ├── POST /channels        # Create channel
│   │   ├── GET /channels/:id     # Get channel
│   │   ├── PUT /channels/:id     # Update channel
│   │   └── POST /channels/:id/verify # Verify channel
│   ├── analytics/                 # Analytics & Reports
│   │   ├── GET /analytics/overview # Dashboard stats
│   │   ├── GET /analytics/agents # Agent performance
│   │   ├── GET /analytics/campaigns # Campaign metrics
│   │   └── GET /analytics/export # Export reports
│   └── webhooks/                  # Webhook Endpoints
│       ├── POST /webhooks/whatsapp
│       ├── POST /webhooks/twilio
│       └── POST /webhooks/stripe
```

## 🗄️ Database Architecture

### **PostgreSQL Schema Design**
```sql
-- Core Business Tables
├── businesses                     # Business/Organization
├── business_users                 # Users in business
├── business_channels             # Communication channels
├── business_documents            # KYB documents
└── business_verifications        # Verification status

-- Authentication & Authorization
├── auth_tokens                   # JWT tokens
├── token_blacklist               # Blacklisted tokens
├── roles                         # User roles
├── permissions                   # Role permissions
└── user_sessions                 # Active sessions

-- Contact Management
├── end_users                     # End users/customers
├── contact_groups                # Contact groupings
├── contact_group_associations    # Many-to-many relation
├── contact_group_fields          # Custom fields
├── contact_uploads               # Import history
└── tags                          # Contact tags

-- AI Agents & Flows
├── agents                        # AI agent definitions
├── agent_nodes                   # Flow nodes
├── ai_configs                    # AI model configs
├── conversation_flows            # Flow definitions
└── flow_executions              # Flow execution logs

-- Messaging System
├── conversations                 # Chat conversations
├── messages                      # Individual messages
├── message_attachments           # File attachments
├── message_status                # Delivery status
└── message_templates             # Reusable templates

-- Campaign Management
├── campaigns                     # Marketing campaigns
├── broadcasts                    # Broadcast messages
├── broadcast_messages            # Message content
├── broadcast_batch_results       # Batch processing
└── campaign_analytics            # Performance metrics

-- Team Management
├── teams                         # Teams/departments
├── team_members                  # Team memberships
├── team_permissions              # Team-based permissions
└── team_invitations              # Pending invites

-- Templates & Content
├── templates                     # Message templates
├── template_components           # Template parts
├── template_buttons              # Interactive buttons
├── template_media                # Media attachments
└── template_providers            # Provider-specific templates

-- Channels & Integrations
├── channels                      # Communication channels
├── channel_configs               # Channel settings
├── webhook_logs                  # Webhook activity
└── integration_settings          # Third-party integrations

-- Analytics & Reporting
├── conversation_analytics        # Chat metrics
├── agent_performance            # AI agent stats
├── campaign_metrics             # Campaign performance
├── user_activity_logs           # Audit trail
└── system_metrics               # System performance
```

### **Redis Cache Strategy**
```
├── sessions:{user_id}            # User sessions
├── rate_limit:{ip}               # Rate limiting
├── cache:agents:{business_id}    # Agent cache
├── cache:contacts:{business_id}  # Contact cache
├── queue:messages                # Message queue
├── queue:broadcasts              # Broadcast queue
├── temp:uploads:{id}             # Temporary uploads
└── realtime:conversations:{id}  # Live chat data
```

## 🔄 Real-time Architecture

### **WebSocket Implementation**
```javascript
// Socket.io Namespaces
├── /conversations                # Chat messages
├── /agents                       # Agent status
├── /broadcasts                   # Campaign updates
├── /notifications                # System notifications
└── /analytics                    # Real-time metrics

// Event Structure
conversations:{conversation_id} = {
  'message:new': (message) => {},
  'message:delivered': (status) => {},
  'message:read': (status) => {},
  'typing:start': (user) => {},
  'typing:stop': (user) => {},
  'agent:joined': (agent) => {},
  'agent:left': (agent) => {}
}
```

## 🚀 Deployment Architecture

### **Development Environment**
```yaml
services:
  frontend:
    build: ./justping-frontend
    ports: ["3001:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://backend:3000
  
  backend:
    build: ./justping-backend
    ports: ["3000:3000"]
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://redis:6379
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=justping
      - POSTGRES_USER=justping
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

### **Production Environment**
```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUD INFRASTRUCTURE                        │
├─────────────────────────────────────────────────────────────────┤
│  CDN (Cloudflare)                                              │
│  ├── Static Assets (Frontend)                                  │
│  ├── Image Optimization                                        │
│  └── DDoS Protection                                           │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer (AWS ALB / Nginx)                               │
│  ├── SSL Termination                                           │
│  ├── Health Checks                                             │
│  └── Auto Scaling                                              │
├─────────────────────────────────────────────────────────────────┤
│  Container Orchestration (Kubernetes / Docker Swarm)          │
│  ├── Frontend Pods (Next.js)                                  │
│  ├── Backend Pods (Node.js)                                   │
│  ├── Worker Pods (Background Jobs)                            │
│  └── Monitoring (Prometheus/Grafana)                          │
├─────────────────────────────────────────────────────────────────┤
│  Managed Services                                              │
│  ├── Database (AWS RDS PostgreSQL)                            │
│  ├── Cache (AWS ElastiCache Redis)                            │
│  ├── Storage (AWS S3 / Azure Blob)                            │
│  ├── Queue (AWS SQS / RabbitMQ)                               │
│  └── Search (Elasticsearch / AWS OpenSearch)                  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Architecture

### **Authentication Flow**
```
1. User Login → Firebase Auth → JWT Token
2. Frontend stores JWT in httpOnly cookies
3. All API requests include JWT in Authorization header
4. Backend validates JWT with Firebase Admin SDK
5. Refresh token rotation for extended sessions
```

### **API Security**
```javascript
// Security Middleware Stack
├── Helmet (Security headers)
├── CORS (Cross-origin requests)
├── Rate Limiting (Express-rate-limit)
├── Input Validation (Joi/Zod)
├── Authentication (Firebase Admin)
├── Authorization (Role-based)
├── Request Logging (Morgan)
└── Error Handling (Custom middleware)
```

## 📊 Monitoring & Analytics

### **Application Monitoring**
```
├── Error Tracking (Sentry)
├── Performance Monitoring (New Relic / DataDog)
├── Uptime Monitoring (Pingdom)
├── Log Aggregation (ELK Stack)
├── Metrics Collection (Prometheus)
└── Alerting (PagerDuty / Slack)
```

### **Business Analytics**
```
├── Conversation Metrics
│   ├── Response Time
│   ├── Resolution Rate
│   ├── Customer Satisfaction
│   └── Agent Performance
├── Campaign Analytics
│   ├── Delivery Rate
│   ├── Open Rate
│   ├── Click-through Rate
│   └── Conversion Rate
├── AI Agent Performance
│   ├── Intent Recognition
│   ├── Response Accuracy
│   ├── Escalation Rate
│   └── Learning Metrics
└── System Performance
    ├── API Response Times
    ├── Database Query Performance
    ├── Memory Usage
    └── CPU Utilization
```

## 🚀 Scaling Strategy

### **Horizontal Scaling**
```
├── Frontend: Multiple Next.js instances behind load balancer
├── Backend: Multiple Node.js instances with session sharing
├── Database: Read replicas + Connection pooling
├── Cache: Redis cluster with sharding
├── File Storage: CDN + Object storage
└── Message Queue: Cluster mode with partitioning
```

### **Performance Optimization**
```
├── Frontend
│   ├── Code Splitting (Dynamic imports)
│   ├── Image Optimization (Next.js Image)
│   ├── Caching (React Query + SWR)
│   ├── Bundle Analysis (Webpack Bundle Analyzer)
│   └── Progressive Web App (PWA)
├── Backend
│   ├── Database Indexing
│   ├── Query Optimization
│   ├── Connection Pooling
│   ├── Response Caching
│   └── Background Job Processing
└── Infrastructure
    ├── Auto Scaling Groups
    ├── Container Orchestration
    ├── Database Sharding
    └── Geographic Distribution
```

This architecture provides a robust, scalable foundation for your JustPing platform while maintaining the modular structure you've already built in your backend.
