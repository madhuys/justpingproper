# Integrations Module Requirements Specification

## 1. Introduction

The Integrations module is a critical component of the JustPing platform that enables customers to connect third-party messaging services and e-commerce platforms. This module provides a unified interface for viewing, configuring, and managing all external service integrations through a gallery view and modal-based configuration workflow.

## 2. Module Overview

### 2.1 Purpose
- Provide a centralized hub for managing all third-party service connections
- Enable seamless integration of messaging channels (WhatsApp, Instagram, Telegram, etc.)
- Support e-commerce platform integrations (Shopify, Wix, BigCommerce, etc.)
- Simplify the connection process with intuitive UI and clear workflows

### 2.2 Scope
**In Scope:**
- Gallery page listing all available integrations
- Per-integration configuration modal with dynamic forms
- WhatsApp sub-provider selection and configuration
- Connection status management (Connected/Action Required)
- Test connection functionality
- In-memory state management (mocked backend)
- Full adherence to atomic design patterns

**Out of Scope (v1):**
- Real backend API integration
- Integration analytics and usage metrics
- Advanced role-based permissions
- Webhook configuration UI
- Custom integration builder

## 3. Technical Architecture

### 3.1 Technology Stack
```javascript
{
  "framework": "Next.js 14+ (App Router)",
  "language": "TypeScript",
  "styling": "Tailwind CSS",
  "ui_components": "shadcn/ui + Atomic Design",
  "state_management": "React Context + useState",
  "data_source": "channels.json (static)",
  "layout": "PostAuth Layout",
  "forms": "React Hook Form + Zod",
  "icons": "Lucide React",
  "notifications": "React Hot Toast"
}
```

### 3.2 File Structure
```
src/
├── app/
│   └── (dashboard)/
│       └── integrations/
│           └── page.tsx                    # Main integrations gallery page
├── components/
│   ├── organisms/
│   │   └── modals/
│   │       └── IntegrationConfigModal.tsx  # Configuration modal
│   └── pages/
│       └── integrations/
│           ├── IntegrationsGallery.tsx     # Gallery component
│           └── IntegrationCard.tsx         # Enhanced ActionCard
├── data/
│   ├── channels.json                       # Integration definitions
│   └── strings/
│       └── integrations.json               # UI strings
├── hooks/
│   └── useIntegrations.ts                  # Integration state hook
└── lib/
    └── integrations/
        ├── types.ts                        # TypeScript definitions
        └── utils.ts                        # Helper functions
```

## 4. Functional Requirements

### 4.1 Integrations Gallery Page

#### 4.1.1 Route & Access
- **URL**: `/integrations`
- **Layout**: PostAuth Layout with parallax background
- **Authentication**: Required (protected route)

#### 4.1.2 Page Header
- **Title**: "Integrations" 
- **Subtitle**: "Connect your favorite tools and services to JustPing"
- **Actions**: Search bar for filtering integrations

#### 4.1.3 Integration Cards Grid
- **Layout**: Responsive grid (4 columns desktop, 2 tablet, 1 mobile)
- **Card Component**: Enhanced ActionCard with integration-specific features

**Card Display Elements:**
```typescript
interface IntegrationCardProps {
  icon: LucideIcon;           // From channels.json icon mapping
  name: string;               // Integration name
  idealFor: string;           // Use case description
  mcpSupported: boolean;      // MCP badge display
  costDetails: string;        // Pricing information
  status: 'connected' | 'action_required' | 'not_connected';
  connectionCount?: number;   // Number of active connections
  lastSync?: Date;           // Last successful sync
  onClick: () => void;       // Open configuration modal
}
```

**Visual Design:**
- Gradient accent based on integration brand colors
- Status indicator (green/amber/gray)
- MCP support badge (if applicable)
- Hover effect with scale and shadow
- Cost details on card footer

### 4.2 Integration Configuration Modal

#### 4.2.1 Modal Structure
```typescript
interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  integration: Integration;
  existingConfig?: IntegrationConfig;
  onSave: (config: IntegrationConfig) => Promise<void>;
  onRemove?: () => Promise<void>;
  onTest: (config: IntegrationConfig) => Promise<TestResult>;
}
```

#### 4.2.2 Configuration Workflow

**Step 1: Provider Selection (WhatsApp only)**
- Display sub-provider options: Gupshup, Wati, Karix, Twilio, JustPing Meta
- Card-based selection with provider descriptions
- Provider-specific constraints displayed

**Step 2: Dynamic Form Generation**
- Fields rendered based on `channels.json` configuration
- Support for field types: text, password, tel, url, textarea, select
- Required field validation
- Help text and tooltips
- Read-only fields with copy-to-clipboard

**Step 3: Advanced Settings (Optional)**
- Webhook URLs (read-only with copy)
- Rate limiting configuration
- Retry policies
- Custom headers

**Step 4: Test Connection**
- Validate all required fields
- Simulate API call with loading state
- Success/failure feedback with detailed messages
- Retry capability on failure

**Step 5: Save Configuration**
- Store in React Context/State
- Update card status in gallery
- Success toast notification
- Close modal and refresh gallery

### 4.3 WhatsApp Sub-Provider Rules

#### 4.3.1 Provider Constraints
| Provider | WABA per App | Numbers per WABA | Special Requirements |
|----------|--------------|------------------|---------------------|
| Gupshup | Multiple | 1 | API Key required |
| Wati | 1 | Multiple | API Endpoint + Key |
| Karix | Multiple | Multiple | Account ID + Token |
| Twilio | 1 | Multiple | Account SID + Token |
| JustPing Meta | 1 | Multiple | Direct Meta integration |

#### 4.3.2 Dynamic Field Management
- Show/hide WABA fields based on provider selection
- Enforce maximum limits in UI
- Provide inline validation messages
- Support multiple phone number inputs where applicable

### 4.4 Integration Status Management

#### 4.4.1 Status Types
- **Not Connected**: No configuration exists
- **Connected**: Successfully configured and tested
- **Action Required**: Configuration exists but needs attention

#### 4.4.2 Status Indicators
- Visual badge on integration card
- Color coding: Green (connected), Amber (action required), Gray (not connected)
- Last sync timestamp for connected integrations
- Error messages for action required status

## 5. Data Specifications

### 5.1 channels.json Structure
```json
{
  "integration_id": {
    "id": "string",
    "name": "string",
    "icon": "LucideIconName",
    "color": "from-color-500 to-color-600",
    "description": "string",
    "idealFor": "string",
    "mcpSupported": boolean,
    "cost": "string",
    "comingSoon": boolean,
    "providers": [
      {
        "id": "string",
        "name": "string",
        "fields": [
          {
            "name": "string",
            "label": "string",
            "type": "text|password|tel|url|textarea|select",
            "required": boolean,
            "placeholder": "string",
            "tooltip": "string",
            "readOnly": boolean,
            "value": "string (for readOnly)",
            "options": [] // for select type
          }
        ]
      }
    ],
    "fields": [] // for direct integrations
  }
}
```

### 5.2 Integration Configuration State
```typescript
interface IntegrationConfig {
  integrationId: string;
  providerId?: string;
  fields: Record<string, any>;
  status: 'connected' | 'action_required';
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
  error?: string;
}

interface IntegrationsState {
  configs: IntegrationConfig[];
  isLoading: boolean;
  error: string | null;
}
```

## 6. UI/UX Requirements

### 6.1 Visual Design
- Consistent with JustPing design system
- Support for light/dark themes
- Smooth transitions and animations
- Responsive layout for all screen sizes
- Accessibility compliant (WCAG 2.1 AA)

### 6.2 Interaction Patterns
- Click card to open configuration modal
- Escape key or click outside to close modal
- Tab navigation through form fields
- Enter key to submit forms
- Loading states for async operations
- Error states with helpful messages

### 6.3 Responsive Behavior
- **Desktop (>1024px)**: 4-column grid, full modal
- **Tablet (768px-1024px)**: 2-column grid, full modal
- **Mobile (<768px)**: 1-column grid, full-screen modal

## 7. Localization

### 7.1 String Management
Create new file: `src/data/strings/integrations.json`
```json
{
  "page": {
    "title": "Integrations",
    "subtitle": "Connect your favorite tools and services to JustPing",
    "search": {
      "placeholder": "Search integrations..."
    }
  },
  "card": {
    "status": {
      "connected": "Connected",
      "action_required": "Action Required",
      "not_connected": "Not Connected"
    },
    "actions": {
      "connect": "Connect",
      "manage": "Manage"
    },
    "labels": {
      "mcp_supported": "MCP Supported",
      "coming_soon": "Coming Soon",
      "ideal_for": "Ideal for:",
      "cost": "Cost:"
    }
  },
  "modal": {
    "title": {
      "connect": "Connect {name}",
      "manage": "Manage {name}"
    },
    "steps": {
      "provider": "Select Provider",
      "configuration": "Configuration",
      "test": "Test Connection"
    },
    "actions": {
      "cancel": "Cancel",
      "back": "Back",
      "next": "Next",
      "test": "Test Connection",
      "save": "Save",
      "remove": "Remove Integration",
      "copy": "Copy"
    },
    "messages": {
      "test_success": "Connection successful!",
      "test_failure": "Connection failed. Please check your credentials.",
      "save_success": "Integration saved successfully",
      "remove_success": "Integration removed",
      "copied": "Copied to clipboard",
      "required_fields": "Please fill in all required fields"
    }
  }
}
```

## 8. Error Handling

### 8.1 Validation Errors
- Field-level validation with inline error messages
- Form-level validation before submission
- Clear error messages with suggested fixes

### 8.2 Connection Errors
- Detailed error messages from test connection
- Retry mechanisms with exponential backoff
- Fallback UI for failed states

### 8.3 System Errors
- Graceful degradation for missing data
- Error boundaries to prevent crashes
- User-friendly error messages

## 9. Performance Requirements

### 9.1 Loading Performance
- Page load time < 1 second
- Modal open time < 200ms
- Form interaction lag < 50ms

### 9.2 Optimization Strategies
- Lazy load integration icons
- Memoize expensive computations
- Debounce search input
- Virtual scrolling for large lists (future)

## 10. Security Considerations

### 10.1 Credential Handling
- Never log sensitive fields (passwords, API keys)
- Use password input type for sensitive fields
- Clear form data on modal close
- No credential storage in localStorage

### 10.2 Input Sanitization
- Sanitize all user inputs
- Validate URLs and prevent XSS
- Escape special characters in display

## 11. Testing Requirements

### 11.1 Unit Tests
- Test form validation logic
- Test provider constraint enforcement
- Test status management
- Test field rendering logic

### 11.2 Integration Tests
- Test full configuration flow
- Test modal open/close behavior
- Test error handling scenarios
- Test responsive layouts

### 11.3 E2E Tests
- Test complete user journey
- Test keyboard navigation
- Test accessibility features
- Test theme switching

## 12. Development Guidelines

### 12.1 Code Standards
- Use TypeScript for all new files
- Follow atomic design principles
- Implement proper error boundaries
- Add comprehensive JSDoc comments

### 12.2 Component Guidelines
- Reuse existing atoms/molecules
- Create new components only when necessary
- Follow naming conventions
- Implement proper prop validation

### 12.3 State Management
- Use React Context for integration state
- Implement optimistic updates
- Handle loading and error states
- Persist state in session storage

## 13. Future Enhancements (v2)

### 13.1 Backend Integration
- Replace mocked API calls with real endpoints
- Implement proper authentication
- Add webhook management
- Store configurations in database

### 13.2 Advanced Features
- Integration health monitoring
- Usage analytics and metrics
- Bulk operations support
- Custom integration builder
- Integration marketplace

### 13.3 Enterprise Features
- Role-based access control
- Audit logging
- API rate limit management
- Custom branding options

## 14. Acceptance Criteria

### 14.1 Functional Criteria
- [ ] Gallery page displays all integrations from channels.json
- [ ] Cards show correct status and information
- [ ] Modal opens on card click
- [ ] Provider selection works for WhatsApp
- [ ] Dynamic form renders all fields correctly
- [ ] Test connection provides feedback
- [ ] Save stores configuration in state
- [ ] Remove deletes configuration
- [ ] Search filters integrations

### 14.2 Non-Functional Criteria
- [ ] Page loads within performance budget
- [ ] All interactions are keyboard accessible
- [ ] Works on all supported browsers
- [ ] Responsive on all screen sizes
- [ ] Passes accessibility audit
- [ ] No console errors or warnings

## 15. Dependencies

### 15.1 External Dependencies
- React 18+
- Next.js 14+
- Tailwind CSS
- shadcn/ui components
- Lucide React icons
- React Hook Form
- Zod validation

### 15.2 Internal Dependencies
- PostAuth Layout
- ActionCard component
- Form components (Input, Select, etc.)
- Modal components
- Toast notifications
- Theme system

## 16. Delivery Checklist

- [ ] Create integrations page component
- [ ] Implement IntegrationConfigModal
- [ ] Add integration-specific strings
- [ ] Create useIntegrations hook
- [ ] Add TypeScript types
- [ ] Implement mock API layer
- [ ] Add loading/error states
- [ ] Implement search functionality
- [ ] Add keyboard navigation
- [ ] Write unit tests
- [ ] Update documentation
- [ ] Run generate-docs.js
- [ ] Code review
- [ ] QA testing
- [ ] Deployment

---

This specification provides comprehensive requirements for building the Integrations module. The implementation should prioritize reusability, maintainability, and user experience while adhering to the existing JustPing design system and development patterns.