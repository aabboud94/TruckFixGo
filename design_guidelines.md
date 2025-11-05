# TruckFixGo Design Guidelines

## Design Approach
**Hybrid Reference-Based Approach**: Combining DoorDash's urgency and tracking UX with Stripe's professional restraint and Linear's clean typography. The platform balances consumer-friendly booking flows with enterprise-grade fleet management dashboards.

## Core Design Principles
1. **Speed & Trust**: Every interaction reinforces quick service and professional credibility
2. **Clear Hierarchy**: Emergency actions (orange) vs. routine operations (blue)
3. **Safety-Forward**: Large touch targets, high contrast, readable fonts for on-the-road use
4. **Professional Polish**: Premium feel that justifies pricing and builds carrier confidence

---

## Typography

**Font Families:**
- **Primary (Headings)**: Inter (700, 600, 500) - Clean, professional, excellent at all sizes
- **Secondary (Body)**: Inter (400, 500) - Same family for consistency
- **Monospace (Data/VINs)**: JetBrains Mono (400) - For unit numbers, VINs, tracking codes

**Type Scale:**
- Hero Headlines: 4xl-6xl (48px-72px), font-weight 700, tight line-height (1.1)
- Section Headlines: 2xl-3xl (24px-36px), font-weight 600
- Card Titles: lg-xl (18px-24px), font-weight 600
- Body Text: base-lg (16px-18px), font-weight 400, line-height 1.6
- Labels/Captions: sm-base (14px-16px), font-weight 500
- Small/Meta: xs-sm (12px-14px), font-weight 400

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **4, 6, 8, 12, 16, 24** consistently
- Component padding: p-6 to p-8
- Section spacing: py-16 to py-24 (desktop), py-12 (mobile)
- Card gaps: gap-6 to gap-8
- Tight spacing (form elements): space-y-4
- Generous breathing room (sections): space-y-16

**Grid Structure:**
- Desktop (lg): 3-4 columns for feature cards, 2 columns for forms
- Tablet (md): 2 columns maximum
- Mobile: Single column, full-width cards

**Container Widths:**
- Max content: max-w-7xl (1280px)
- Content sections: max-w-6xl (1152px)
- Forms/text: max-w-2xl (672px)

---

## Color System

**Primary Palette:**
- **Fleet Blue**: #1E3A8A (trust, professionalism, primary buttons for scheduled services)
- **Safety Orange**: #F97316 (urgency, emergency CTAs, live status indicators)
- **Neutrals**: Gray-50 to Gray-900 (backgrounds, borders, text)
- **Success Green**: #059669 (completed jobs, on-time status)
- **Warning Yellow**: #F59E0B (en route, pending approval)

**Application:**
- Emergency CTAs: Orange background with white text
- Fleet service CTAs: Blue background with white text
- Status indicators: Color-coded badges (gray=new, blue=assigned, yellow=en route, green=completed)
- Backgrounds: White cards on gray-50 base, gray-100 for alternate sections
- Borders: gray-200 for subtle divisions, gray-300 for defined boundaries

---

## Component Library

### Navigation
- **Desktop Header**: Horizontal nav with logo left, links center, orange "Emergency Repair" button right, blue "Fleet Services" button
- **Mobile Header**: Sticky top bar with hamburger menu, logo center, floating emergency button (bottom-right FAB)
- **Footer**: 4-column grid (Company, Services, Resources, Contact) with newsletter signup, social links, trust badges

### Hero Sections
- **Homepage Hero**: Full-width background image (mechanic servicing semi truck on highway at sunset), h-screen with centered overlay
- **Overlay**: Semi-transparent dark gradient (black with 40% opacity) for text readability
- **Content**: Centered white text, headline (6xl bold), subheadline (xl regular), dual CTAs with blurred backgrounds (orange + blue buttons with backdrop-blur-md)
- **Trust Indicators**: Below CTAs - "24/7 Available" | "500+ Trucks Serviced" | "15min Avg Response" with icons

### Cards
- **Service Cards**: White background, rounded-xl, shadow-md on hover, p-6
- **Structure**: Icon (top, 48x48, orange or blue), title (lg font-weight-600), description (base text-gray-600), hover lift effect
- **Job Cards**: Border-l-4 with status color (orange/blue/green), includes photo thumbnail, VIN, location pin, timestamp

### Forms
- **Input Fields**: Floating labels, border-gray-300, focus:border-blue-500, rounded-lg, h-12 minimum (mobile tap targets)
- **Buttons**: Primary (orange/blue), rounded-lg, px-6 py-3 minimum, font-weight-600, shadow-sm
- **Multi-step Forms**: Progress bar (top), step indicators with checkmarks, clear "Back/Next" navigation

### Maps
- **Tracking Map**: Full-width card, rounded-xl, h-96 minimum
- **Custom Markers**: Truck icon (red pin), mechanic icon (blue animated pulse), route line (blue dashed)
- **ETA Display**: Floating card overlay (top-right) with countdown timer and mechanic photo

### Dashboards
- **Stat Cards**: Grid of metrics, each card has large number (3xl font-weight-700), label below (sm text-gray-600), icon (top-right, gray-400)
- **Tables**: Zebra striping (even rows gray-50), sticky headers, row hover (gray-100), sortable columns with icons
- **Charts**: Minimalist line/bar charts using Chart.js with brand colors, subtle gridlines

### Status Indicators
- **Badges**: Rounded-full, px-3 py-1, text-xs font-weight-600, uppercase tracking-wide
- **Colors**: Gray (New), Blue (Assigned), Yellow (En Route), Green (On Site/Completed), Red (Cancelled)

### Modals & Overlays
- **Modal**: Centered, max-w-2xl, rounded-xl, shadow-2xl, backdrop-blur with dark overlay
- **Slide-out Panels**: Fixed right, w-96, full-height, shadow-xl for job details

---

## Images

**Hero Image:**
- Large full-width hero image on homepage (mechanic working on semi truck tire at golden hour, highway in background)
- Additional hero images for service-specific landing pages (truck wash in action, fleet yard maintenance, roadside repair at night)

**Section Images:**
- Service type cards: Icons (tire, wrench, fuel pump, truck) - use Heroicons
- Contractor profiles: Professional headshots, rounded-full, 80x80px minimum
- Before/after wash photos: Grid layout, rounded-lg, aspect-square
- Fleet yards: Wide establishing shots showing multiple trucks

**Placement:**
- Homepage hero: Full viewport height with gradient overlay
- Service sections: Alternating left/right image-text layouts
- Testimonials: Customer photos (rounded-full, 48x48) with star ratings
- Blog: Featured images (aspect-video, rounded-lg)

---

## Mobile Optimization

**Touch Targets:**
- Minimum 48x48px for all interactive elements
- Emergency FAB: 64x64px, fixed bottom-right, z-50, orange with white icon
- Form inputs: h-12 to h-14 for easy tapping
- Navigation items: py-4 for comfortable spacing

**Mobile-Specific:**
- Collapsible filter panels (slide from bottom)
- Swipeable job cards
- Bottom sheet for mechanic details on tracking page
- Click-to-call buttons (prominent, blue, icon-left)

---

## Animations

**Sparingly Applied:**
- Status badge transitions (color fade on update)
- Card hover lift (transform scale-105, subtle)
- Map marker pulse animation (for mechanic location)
- Loading spinners (orange/blue dual-ring, center)
- Smooth scroll to section anchors

**Avoid:**
- Excessive parallax
- Auto-playing carousels
- Distracting background animations

---

## Accessibility

- Maintain 4.5:1 contrast ratio minimum
- Form labels always visible (floating pattern)
- Focus states: 2px ring in brand color
- Skip to main content link
- Alt text for all images
- ARIA labels for icon buttons