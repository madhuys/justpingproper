# JustPing.AI - Design System Documentation

## Table of Contents
1. [Design Principles](#design-principles)
2. [Brand Identity](#brand-identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Layout & Grid System](#layout--grid-system)
6. [Components Library](#components-library)
7. [Icons & Imagery](#icons--imagery)
8. [Interaction Patterns](#interaction-patterns)
9. [Responsive Design](#responsive-design)
10. [Accessibility Guidelines](#accessibility-guidelines)
11. [Motion & Animation](#motion--animation)

---

## Design Principles

### Core Principles
1. **Clarity First**: Every interface element should have a clear purpose
2. **Progressive Disclosure**: Show information as needed, avoid overwhelming users
3. **Consistency**: Maintain visual and behavioral consistency across all touchpoints
4. **Efficiency**: Minimize clicks and cognitive load for common tasks
5. **Trust & Security**: Design should convey reliability and data safety

### Design Philosophy
- **Clean & Professional**: Business-focused aesthetic with minimal distractions
- **User-Centric**: Prioritize user goals and workflows
- **Scalable**: Components should work across different contexts
- **Accessible**: Inclusive design for all users

---

## Brand Identity

### Logo Usage
```
Primary Logo:
┌─────────────┐
│  P  │ Text  │  - Blue circle with "P" + "JUST PING" text
└─────────────┘

Logo Variations:
- Full logo (icon + text) for headers
- Icon only for mobile/compact views
- Monochrome versions for different backgrounds
```

### Brand Values
- **Intelligent**: AI-powered automation
- **Efficient**: Streamlined workflows
- **Connected**: Unified communication
- **Professional**: Enterprise-ready

---

## Color System

### Primary Colors
```scss
// Brand Colors
$primary-blue: #1E3A8A;        // Main brand color (navigation, CTAs)
$primary-blue-hover: #1E40AF;  // Hover state
$primary-blue-light: #3B82F6;  // Accent elements

// Semantic Colors
$success-green: #10B981;       // Success states, confirmations
$error-red: #EF4444;           // Errors, destructive actions
$warning-yellow: #F59E0B;      // Warnings, alerts
$info-blue: #3B82F6;           // Information, tips

// Neutral Palette
$gray-900: #111827;  // Primary text
$gray-700: #374151;  // Secondary text
$gray-500: #6B7280;  // Muted text, placeholders
$gray-400: #9CA3AF;  // Disabled states
$gray-300: #D1D5DB;  // Borders
$gray-200: #E5E7EB;  // Dividers
$gray-100: #F3F4F6;  // Background alternate
$gray-50:  #F9FAFB;  // Light backgrounds
$white:    #FFFFFF;  // Base background

// Special Colors
$pink-100: #FCE7F3;  // Light pink for tags/badges
$pink-500: #EC4899;  // Pink accents
```

### Color Usage Guidelines

#### Primary Actions
- **Primary CTA**: `$primary-blue` background, white text
- **Secondary CTA**: White background, `$primary-blue` text, `$primary-blue` border
- **Destructive CTA**: `$error-red` styling for delete/remove actions

#### Status Indicators
- **Success**: `$success-green` - "Invitation sent successfully"
- **Error**: `$error-red` - "User has been removed"
- **Info**: `$info-blue` - Informational messages
- **Neutral**: `$gray-500` - "Not Provided" states

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Inter', 
             'Helvetica Neue', sans-serif;
```

### Type Scale
```scss
// Headings
$h1: 32px / 40px / 700;  // size / line-height / weight
$h2: 24px / 32px / 600;
$h3: 20px / 28px / 600;
$h4: 18px / 24px / 600;
$h5: 16px / 24px / 600;

// Body Text
$body-large:  16px / 24px / 400;
$body-base:   14px / 20px / 400;
$body-small:  12px / 16px / 400;

// Special Text
$label:       12px / 16px / 500;  // Form labels
$button:      14px / 20px / 500;  // Button text
$caption:     11px / 16px / 400;  // Helper text
```

### Text Colors
- **Primary Text**: `$gray-900` on white background
- **Secondary Text**: `$gray-700` for less important information
- **Muted Text**: `$gray-500` for placeholders, hints
- **Link Text**: `$primary-blue` with underline on hover

---

## Layout & Grid System

### Page Structure
```
┌─────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                    │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │            Main Content Area            │
│   (240px)    │              (Fluid)                    │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Grid System
- **Container Max Width**: 1440px
- **Columns**: 12-column grid
- **Gutters**: 24px (desktop), 16px (tablet), 12px (mobile)
- **Margins**: 24px (desktop), 16px (tablet/mobile)

### Spacing Scale
```scss
$space-0:  0px;
$space-1:  4px;
$space-2:  8px;
$space-3:  12px;
$space-4:  16px;
$space-5:  24px;
$space-6:  32px;
$space-7:  40px;
$space-8:  48px;
$space-9:  64px;
$space-10: 80px;
```

---

## Components Library

### Navigation Components

#### Sidebar Navigation
```scss
.sidebar {
  width: 240px;
  background: $primary-blue;
  color: white;
  
  .nav-item {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 12px;
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    &.active {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}
```

#### Profile Badge
```scss
.profile-badge {
  background: rgba(30, 58, 138, 0.1);
  border-radius: 12px;
  padding: 16px;
  
  .completion-indicator {
    font-size: 14px;
    color: $gray-700;
  }
}
```

### Form Components

#### Input Fields
```scss
.form-input {
  width: 100%;
  padding: 10px 16px;
  border: 1px solid $gray-300;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s;
  
  &:focus {
    border-color: $primary-blue;
    outline: none;
    box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  }
  
  &:disabled {
    background: $gray-50;
    color: $gray-400;
  }
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: $gray-700;
  
  .required {
    color: $error-red;
  }
}
```

#### Buttons
```scss
// Primary Button
.btn-primary {
  background: $primary-blue;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  
  &:hover {
    background: $primary-blue-hover;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
  }
}

// Secondary Button
.btn-secondary {
  background: white;
  color: $primary-blue;
  border: 1px solid $primary-blue;
  padding: 10px 24px;
  border-radius: 8px;
}

// Destructive Button
.btn-danger {
  background: $error-red;
  color: white;
  
  &:hover {
    background: #DC2626;
  }
}
```

#### Select Dropdowns
```scss
.form-select {
  appearance: none;
  background-image: url('chevron-down.svg');
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px;
}
```

### Card Components

#### Profile Card
```scss
.profile-card {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 12px;
  padding: 24px;
  
  .avatar-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .info-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    
    .icon {
      color: $gray-500;
    }
  }
}
```

#### Team Member Card
```scss
.team-member-card {
  background: white;
  border: 1px solid $gray-200;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .member-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .member-role {
    font-size: 12px;
    color: $gray-500;
  }
}
```

### Modal Components

#### Modal Structure
```scss
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid $gray-200;
  
  h2 {
    font-size: 20px;
    font-weight: 600;
  }
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid $gray-200;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
```

### Status Components

#### Toast Notifications
```scss
.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease;
  
  &.success {
    background: $success-green;
    color: white;
  }
  
  &.error {
    background: $error-red;
    color: white;
  }
}
```

#### Progress Indicators
```scss
.progress-bar {
  height: 4px;
  background: $gray-200;
  border-radius: 2px;
  overflow: hidden;
  
  .progress-fill {
    height: 100%;
    background: $primary-blue;
    transition: width 0.3s ease;
  }
}

.step-indicator {
  display: flex;
  align-items: center;
  
  .step {
    display: flex;
    align-items: center;
    
    .step-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.completed {
        background: $success-green;
        color: white;
      }
      
      &.active {
        background: $primary-blue;
        color: white;
      }
      
      &.pending {
        background: white;
        border: 2px solid $gray-300;
        color: $gray-500;
      }
    }
    
    .step-line {
      width: 100px;
      height: 2px;
      background: $gray-300;
      
      &.completed {
        background: $success-green;
      }
    }
  }
}
```

### Data Display

#### Tables
```scss
.data-table {
  width: 100%;
  border-collapse: collapse;
  
  thead {
    background: $gray-50;
    
    th {
      padding: 12px 16px;
      text-align: left;
      font-weight: 500;
      color: $gray-700;
      border-bottom: 1px solid $gray-200;
    }
  }
  
  tbody {
    tr {
      border-bottom: 1px solid $gray-200;
      
      &:hover {
        background: $gray-50;
      }
    }
    
    td {
      padding: 16px;
    }
  }
}
```

#### Empty States
```scss
.empty-state {
  text-align: center;
  padding: 48px 24px;
  
  .empty-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    opacity: 0.5;
  }
  
  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: $gray-900;
    margin-bottom: 8px;
  }
  
  .empty-description {
    color: $gray-500;
    margin-bottom: 24px;
  }
}
```

---

## Icons & Imagery

### Icon System
- **Icon Library**: Lucide React (as specified in architecture)
- **Icon Sizes**: 16px (small), 20px (default), 24px (large)
- **Icon Colors**: Inherit from parent or specific semantic colors

### Common Icons Usage
```
Navigation:
- Campaigns: 📢 (megaphone)
- Aggregations: 🔄 (layers)
- Contacts: 👥 (users)
- Templates: 📄 (file-text)
- Agents: 🤖 (bot)
- Integrations: 🔗 (link)
- Team Inbox: 📧 (inbox)
- Business Profile: 🏢 (building)
- Billing: 💳 (credit-card)

Actions:
- Edit: ✏️ (pencil)
- Delete: 🗑️ (trash)
- Add: ➕ (plus)
- Remove: ➖ (minus)
- Upload: ⬆️ (upload)
- Download: ⬇️ (download)
- Send: ➡️ (send)
```

### Avatar System
```scss
.avatar {
  border-radius: 50%;
  object-fit: cover;
  
  &.avatar-sm { width: 32px; height: 32px; }
  &.avatar-md { width: 48px; height: 48px; }
  &.avatar-lg { width: 64px; height: 64px; }
  &.avatar-xl { width: 96px; height: 96px; }
  
  // Placeholder avatar
  &.avatar-placeholder {
    background: $gray-300;
    display: flex;
    align-items: center;
    justify-content: center;
    color: $gray-600;
    font-weight: 500;
  }
}
```

---

## Interaction Patterns

### Hover States
- **Buttons**: Slight elevation with shadow
- **Links**: Underline appears
- **Cards**: Border color change or slight shadow
- **Table Rows**: Background color change

### Focus States
- **Inputs**: Blue border with soft shadow
- **Buttons**: Visible outline for keyboard navigation
- **Links**: Outline offset for accessibility

### Loading States
```scss
.loading-spinner {
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

.skeleton-loader {
  background: linear-gradient(90deg, $gray-200 25%, $gray-100 50%, $gray-200 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  
  @keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
}
```

### Form Validation
- **Real-time validation**: Show feedback as user types
- **Error messages**: Below input fields in red
- **Success indicators**: Green checkmark for valid inputs
- **Required fields**: Red asterisk in label

---

## Responsive Design

### Breakpoints
```scss
$mobile:  320px - 767px;
$tablet:  768px - 1023px;
$desktop: 1024px - 1439px;
$wide:    1440px+;
```

### Mobile Adaptations
1. **Navigation**: Hamburger menu replaces sidebar
2. **Tables**: Horizontal scroll or card view
3. **Modals**: Full-screen on mobile
4. **Forms**: Stack labels above inputs
5. **Buttons**: Full-width on mobile

### Touch Targets
- Minimum touch target: 44x44px
- Spacing between targets: 8px minimum
- Increase padding for mobile interactions

---

## Accessibility Guidelines

### Color Contrast
- **Normal Text**: 4.5:1 contrast ratio minimum
- **Large Text**: 3:1 contrast ratio minimum
- **Interactive Elements**: Clear focus indicators

### Keyboard Navigation
1. All interactive elements must be keyboard accessible
2. Logical tab order
3. Skip links for main content
4. Focus trapping in modals

### Screen Reader Support
```html
<!-- Use semantic HTML -->
<nav role="navigation" aria-label="Main navigation">
<main role="main" aria-label="Main content">
<button aria-label="Edit profile">

<!-- Status announcements -->
<div role="status" aria-live="polite">
  Invitation sent successfully
</div>

<!-- Form labels -->
<label for="email">Email Address *</label>
<input id="email" required aria-required="true">
```

### ARIA Guidelines
- Use native HTML elements when possible
- Add ARIA labels for icon-only buttons
- Announce dynamic content changes
- Proper heading hierarchy

---

## Motion & Animation

### Animation Principles
1. **Purpose**: Every animation should have meaning
2. **Performance**: Keep animations under 300ms
3. **Subtlety**: Less is more
4. **Consistency**: Same easing for similar actions

### Common Animations
```scss
// Easing functions
$ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
$ease-out: cubic-bezier(0, 0, 0.2, 1);

// Transitions
.transition-all {
  transition: all 0.2s $ease-in-out;
}

.transition-colors {
  transition: background-color 0.2s, color 0.2s, border-color 0.2s;
}

// Fade animations
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Micro-interactions
- **Button Press**: Scale down slightly (0.95)
- **Toggle Switch**: Smooth position change
- **Accordion**: Height animation with fade
- **Tab Change**: Slide indicator

---

## Implementation Guidelines

### CSS Architecture
```scss
// Use CSS Modules or styled-components
styles/
├── base/
│   ├── _reset.scss
│   ├── _typography.scss
│   └── _variables.scss
├── components/
│   ├── _buttons.scss
│   ├── _forms.scss
│   ├── _modals.scss
│   └── _cards.scss
├── layout/
│   ├── _sidebar.scss
│   ├── _header.scss
│   └── _grid.scss
└── themes/
    ├── _light.scss
    └── _dark.scss
```

### Component Naming
```scss
// BEM Methodology
.component-name {}
.component-name__element {}
.component-name--modifier {}

// Example
.team-member-card {}
.team-member-card__avatar {}
.team-member-card__info {}
.team-member-card--invited {}
```

### Dark Mode Support
```scss
// CSS Variables for theming
:root {
  --color-background: #FFFFFF;
  --color-text: #111827;
  --color-border: #E5E7EB;
}

[data-theme="dark"] {
  --color-background: #111827;
  --color-text: #F9FAFB;
  --color-border: #374151;
}
```

---

## Design Checklist

### Before Implementation
- [ ] Colors meet accessibility standards
- [ ] Components work on all breakpoints
- [ ] Loading states are defined
- [ ] Error states are designed
- [ ] Empty states are included
- [ ] Touch targets are adequate
- [ ] Keyboard navigation works
- [ ] Dark mode is considered

### Quality Assurance
- [ ] Consistent spacing used
- [ ] Typography hierarchy clear
- [ ] Interactive states defined
- [ ] Animations are smooth
- [ ] Forms are accessible
- [ ] Icons have proper labels
- [ ] Content is readable
- [ ] Design is responsive

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial design system |

---

## Resources

### Design Tools
- **Figma**: Main design tool
- **Storybook**: Component documentation
- **Chromatic**: Visual regression testing

### References
- Material Design Guidelines
- Human Interface Guidelines
- Web Content Accessibility Guidelines (WCAG)