# 2Mins Challenge App - Design Guidelines

## Design Approach

**Selected Approach:** Material Design Dark Theme adapted for wellness/productivity
**Justification:** The app requires a sophisticated, mature dark interface for a utility-focused challenge tracking experience. Material Design provides robust dark mode patterns ideal for this use case.

**Key Design Principles:**
- Sophisticated minimalism for adult users
- Dark-first design with strategic use of depth and elevation
- Clear information hierarchy for quick 2-minute interactions
- Focus on functionality and immediate usability

---

## Core Design Elements

### A. Typography

**Font Family:** Google Fonts - "Inter" (primary), "DM Sans" (headings)

**Hierarchy:**
- Page Titles: 2xl/3xl, semi-bold, tracking tight
- Section Headers: xl/2xl, medium, tracking normal
- Card Titles: lg, medium
- Body Text: base, regular, leading relaxed
- Timer Display: 5xl/6xl, bold, tabular numbers
- Stats/Numbers: 2xl/3xl, semi-bold
- Captions/Metadata: sm, regular, reduced opacity

### B. Layout System

**Spacing Units:** Tailwind units of 2, 4, 6, and 8 as primary building blocks
- Component padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Card gaps: gap-4, gap-6
- Screen margins: px-4 (mobile), px-6 (tablet), px-8 (desktop)

**Container Strategy:**
- Mobile: Full width with px-4 padding
- Tablet/Desktop: max-w-2xl centered for main content
- Wide sections (dashboard): max-w-6xl with grid layouts

### C. Component Library

#### Navigation
- Bottom navigation bar (mobile): Fixed bottom, 4-5 primary sections
- Top app bar: Minimal, shows context (e.g., "Today's Challenge"), user profile icon
- Icons: Heroicons (outline for inactive, solid for active states)

#### Challenge Cards
- Rounded corners (rounded-lg to rounded-xl)
- Elevated appearance with subtle borders/shadows
- Category indicator: Small pill/tag in top corner
- Challenge title: Prominent, 2-3 lines max
- Duration indicator: "2 min" badge
- Action button: Full width at bottom or prominent CTA

#### Timer Interface
- Circular progress ring: Large, centered (200-240px diameter)
- Time display: Centered within circle, large bold numbers
- Start/Pause button: Centered below circle, prominent
- Challenge details: Above timer, concise description
- Background: Slightly blurred version of category-themed subtle gradient

#### Progress Dashboard
- Streak counter: Large, eye-catching card with flame/calendar icon
- Points display: Prominent number with subtle animation on update
- Category breakdown: Grid of cards (2 columns mobile, 3+ desktop)
- Recent activity: Vertical list of completed challenges with timestamps
- Achievement badges: Horizontal scrollable row of unlocked achievements

#### Challenge History
- Timeline view: Vertical list with date separators
- Each entry: Compact card showing category icon, challenge name, completion time
- Filter chips: Horizontal scrollable row for category filtering
- Empty state: Motivational illustration + CTA to start first challenge

#### Category Selection
- Grid layout: 2 columns (mobile), 3 columns (tablet+)
- Large category cards with:
  - Distinctive icon (top, large size h-12 to h-16)
  - Category name (bold, centered)
  - Challenge count (small text, subtle)
  - Subtle category-specific accent (via opacity variations, not colors)

#### Forms & Inputs
- Rounded inputs (rounded-lg)
- Consistent padding (p-3 to p-4)
- Clear focus states with subtle ring
- Label above input pattern
- Helper text below when needed

### D. Iconography

**Icon Library:** Heroicons (via CDN)
**Icon Sizes:**
- Navigation: h-6 w-6
- Category icons: h-12 w-12 to h-16 w-16
- Card icons: h-8 w-8
- Inline icons: h-5 w-5
- Stat icons: h-10 w-10

**Style:** Outline icons for most UI elements, solid icons for active/selected states

**Category Icons:**
- Physical: Running figure, dumbbell
- Mental: Brain, meditation pose
- Learning: Book, lightbulb
- Finance: Chart, coin stack
- Relationships: Heart, people group

### E. Depth & Elevation

**Card Hierarchy:**
- Inactive cards: Subtle border
- Active/hover cards: Slight elevation with shadow
- Modal overlays: Strong elevation with backdrop
- Bottom navigation: Elevated with top border/shadow

### F. Interactive Elements

**Buttons:**
- Primary action: Large, rounded-full or rounded-lg, bold text
- Secondary action: Outline style or ghost variant
- Icon buttons: Rounded-full, consistent h-10 w-10 sizing
- Disabled state: Reduced opacity (opacity-50)

**Touch Targets:**
- Minimum 44px height for all interactive elements
- Adequate spacing between tappable items (min 8px gap)

### G. Animations

**Minimal, Purposeful Animations Only:**
- Timer countdown: Smooth circular progress ring animation
- Streak increment: Quick scale + fade celebration effect
- Challenge completion: Checkmark animation
- Page transitions: Subtle slide transitions (100-200ms)
- No decorative or auto-playing animations

---

## Screen-Specific Layouts

### Home/Today Screen
- Top section: Current streak + points (horizontal cards)
- Featured challenge: Large, prominent card with "Start Now" CTA
- Category quick access: Grid of category cards
- Recent achievements: Horizontal scrollable row (if any unlocked)

### Challenge Active Screen
- Full-screen focus mode
- Circular timer: Centered, dominant
- Challenge instruction: Above timer, clear and concise
- Pause/Stop buttons: Below timer
- Minimal distractions, no bottom nav during active challenge

### Progress Screen
- Stats overview: 3-column grid (streak, total challenges, points)
- Weekly chart: Simple bar/line chart showing activity
- Category breakdown: Pie or donut chart with legend
- Milestones: List of upcoming achievements with progress bars

### Profile/Settings Screen
- User info: Avatar + name at top
- Settings sections: Grouped lists with dividers
- Notification preferences: Toggle switches
- Account actions: Clear, separated buttons (logout, delete account)

---

## Responsive Behavior

**Mobile (default):**
- Single column layouts
- Bottom navigation (4-5 items)
- Stacked cards
- Full-width CTAs

**Tablet (md: 768px+):**
- 2-column grids for categories/stats
- Side navigation option (if complex enough)
- Wider max-width containers

**Desktop (lg: 1024px+):**
- 3-column grids where appropriate
- Centered layout with max-width
- Larger touch targets become clickable with hover states

---

## Images

**Hero/Featured Sections:**
No large hero images required. This is a utility app focused on functionality.

**Decorative Elements:**
- Category cards: Use subtle gradient overlays or abstract patterns (optional background elements)
- Empty states: Minimal illustrations (line art style, mature aesthetic)
- Achievement badges: Custom icon designs or simple geometric shapes

**Profile:**
- User avatar: Circular, default placeholder with initials if no photo

---

## Accessibility Considerations

- Consistent focus indicators (ring-2 with offset)
- ARIA labels for icon-only buttons
- Sufficient contrast ratios for all text on dark backgrounds
- Touch target sizes minimum 44x44px
- Semantic HTML structure (nav, main, section elements)
- Screen reader announcements for timer updates and challenge completion