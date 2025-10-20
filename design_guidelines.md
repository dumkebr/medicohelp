# MédicoHelp Design Guidelines

## Design Approach

**Selected Approach:** Medical Professional Design System
**Justification:** Healthcare applications demand trust, clarity, and efficiency. The design must convey professionalism while maintaining excellent usability for doctors in high-pressure environments. Drawing inspiration from modern healthcare platforms like Epic MyChart, Zocdoc, and Doximity, combined with clean design system principles.

**Core Principles:**
- Trust through clarity and consistency
- Efficiency in clinical workflows
- Medical-grade professionalism with modern aesthetics
- Minimal cognitive load for busy practitioners

---

## Color Palette

### Light Mode
- **Primary Green:** 160 100% 35% (medical professional green - trust and health)
- **Primary Dark:** 160 100% 25% (hover states, emphasis)
- **Background:** 0 0% 98% (soft white, reduces eye strain)
- **Card Surface:** 0 0% 100% (pure white for content clarity)
- **Border:** 160 15% 90% (subtle green-tinted borders)
- **Text Primary:** 160 10% 15% (deep charcoal with green undertone)
- **Text Muted:** 160 5% 45% (secondary information)
- **Success:** 142 76% 36% (positive actions, confirmations)
- **Warning:** 38 92% 50% (alerts, important notices)
- **Error:** 0 84% 60% (critical alerts, validation errors)

### Dark Mode
- **Primary Green:** 160 60% 55% (adjusted for dark backgrounds)
- **Primary Dark:** 160 80% 45% (hover states)
- **Background:** 160 80% 8% (deep medical green-black)
- **Card Surface:** 160 60% 12% (elevated dark green)
- **Border:** 160 30% 22% (darker green borders)
- **Text Primary:** 160 10% 95% (crisp white with hint of green)
- **Text Muted:** 160 8% 70% (readable secondary text)

---

## Typography

**Font Stack:** 
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif
- Monospace (for medical codes, IDs): 'JetBrains Mono', 'Consolas', monospace

**Type Scale:**
- **Display:** 32px / 700 / -0.02em (section headers, dashboard titles)
- **H1:** 24px / 700 / -0.01em (page titles)
- **H2:** 20px / 600 / 0 (card titles, subsections)
- **H3:** 16px / 600 / 0 (form sections, small headers)
- **Body:** 15px / 400 / 0 (primary content, chat messages)
- **Body Small:** 13px / 400 / 0 (metadata, timestamps, labels)
- **Caption:** 12px / 500 / 0.02em (pills, badges, micro-text)

**Line Heights:** 1.5 for body text, 1.3 for headings

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4 to p-6
- Card padding: p-6 to p-8
- Section gaps: gap-6 to gap-8
- Large spacing: mt-12, mb-16, py-20

**Grid System:**
- Sidebar: Fixed 280px (expandable context)
- Main content: max-w-[1200px] with px-6
- Chat area: max-w-[900px] for optimal reading
- Form layouts: grid-cols-1 md:grid-cols-2 gap-6

**Breakpoints:** sm:640px, md:768px, lg:1024px, xl:1280px

---

## Component Library

### Navigation & Sidebar
- **Sidebar:** 280px fixed width, sticky positioning, dark card surface
- **Logo area:** py-6 px-6, border-b, brand mark + wordmark
- **Menu items:** py-3 px-4, rounded-lg, hover:bg-primary/8, active:bg-primary/12 active:font-semibold
- **Active indicator:** 4px vertical accent bar on left or filled dot icon
- **Section dividers:** my-4, border-t with muted border color

### Chat Interface
- **Message bubbles:** Distinct styles for user vs. assistant
  - User messages: text-right, bg-primary/5, rounded-2xl, p-4, max-w-[85%] ml-auto
  - Assistant messages: bg-card, border, rounded-2xl, p-4, max-w-[90%]
- **Chat input:** Multi-line textarea, min-h-[120px], rounded-xl, border-2 focus:border-primary
- **Send button:** Prominent, rounded-xl, px-6 py-3, primary background
- **File upload area:** Dashed border, rounded-lg, p-4, hover effect, shows file previews
- **Quota display:** Pill badge in header, shows remaining/total with icon

### Patient Management
- **Patient cards:** Border, rounded-xl, p-6, hover:shadow-md transition
- **Patient list:** Divide-y with gap-2, each row has grid layout
- **Form inputs:** 
  - Rounded-lg, px-4 py-3, border-2
  - Labels: text-sm font-medium mb-2 block
  - Helper text: text-xs text-muted mt-1
  - Required fields: red asterisk
- **Action buttons:** 
  - Primary: Green background, white text
  - Secondary: Border with green text
  - Danger: Red for delete operations

### Header
- **Fixed header:** Sticky top-0, backdrop-blur-lg, border-b
- **Status badges:** Inline pills showing beta status, quota, user info
- **Theme toggle:** Icon button, rounded-full, hover:bg-primary/10

### Cards & Surfaces
- **Card elevation:** border + subtle shadow (shadow-sm to shadow-md on hover)
- **Rounded corners:** rounded-xl for cards, rounded-lg for smaller components
- **Internal spacing:** p-6 for standard cards, p-8 for emphasis areas

### Buttons
- **Primary:** bg-primary text-white rounded-lg px-6 py-3 font-medium hover:bg-primary-dark
- **Secondary:** border-2 border-primary text-primary bg-transparent hover:bg-primary/5
- **Icon buttons:** p-2 rounded-full hover:bg-muted/10
- **Disabled:** opacity-50 cursor-not-allowed

### Status & Feedback
- **Pills/Badges:** rounded-full px-3 py-1 text-xs font-semibold bg-primary/10 text-primary
- **Success alerts:** Green background, checkmark icon
- **Error alerts:** Red background, alert icon, rounded-lg p-4
- **Loading states:** Skeleton screens with pulse animation

### Forms
- **Input groups:** Stacked with consistent spacing (gap-6)
- **Two-column layout:** For name/CPF, date/phone pairs
- **Validation:** Red border + error message below input
- **Focus states:** Ring-2 ring-primary ring-offset-2

---

## Visual Enhancements

### Micro-interactions
- Smooth transitions (150ms to 200ms) on hover states
- Button press: slight scale (scale-[0.98])
- Menu item activation: subtle slide-in of accent bar
- Card hover: lift with shadow increase

### Icons
- **Library:** Heroicons (outline for navigation, solid for actions)
- **Size:** w-5 h-5 for menu items, w-6 h-6 for large buttons
- **Color:** Inherit text color or primary color for emphasis

### Shadows
- **Card:** 0 1px 3px rgba(0,0,0,0.08)
- **Elevated:** 0 4px 12px rgba(0,0,0,0.12)
- **Float:** 0 8px 24px rgba(0,0,0,0.16)

---

## Images

**Medical Context Images:** This application does not require hero images or decorative photography. Focus on functional UI elements:
- Patient profile placeholders: Generic avatar icons
- Exam upload previews: Thumbnail previews of uploaded images (100px square, rounded-lg)
- Logo: Clean, professional medical symbol (existing logo.svg)
- Empty states: Simple illustrations for "no patients yet" or "no messages"

**No large hero sections needed** - this is a functional medical tool where screen real estate is precious for clinical information.

---

## Accessibility

- Maintain WCAG AA contrast ratios (4.5:1 for text)
- All interactive elements: min 44px touch target
- Focus indicators: Visible ring on all focusable elements
- Dark mode: Reduced contrast to prevent eye strain during long sessions
- Form labels: Always associated with inputs
- Error messages: Announce via aria-live regions