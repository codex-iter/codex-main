# CODEX Official Website - Deep Dive Report

## Overview
The CODEX Official Website is a modern web application built using a decoupled (headless CMS) architecture. The frontend is a React application built with Vite, TypeScript, and styled with Tailwind CSS. The "database" or content management backend is powered by **Sanity CMS**.

The website features a strong emphasis on interactive, brutalist-inspired aesthetics, micro-animations, and fluid page transitions. It leverages both **Framer Motion** and **GSAP** for its animation design flow.

---

## Architecture & Tech Stack
- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4, PostCSS, Shadcn, Radix UI
- **Routing:** React Router v7 (`react-router-dom`)
- **Animations:** Framer Motion, GSAP, Canvas API, TW Animate CSS
- **Backend / Database:** Sanity CMS (`@sanity/client`)

---

## Database (Sanity CMS) Deep Dive

Instead of a traditional relational database (like SQL or MongoDB), this project uses **Sanity**, a headless CMS. All data is structured via schemas defined in the `backend/schemaTypes/` folder. The frontend pulls this data dynamically using **GROQ** (Graph-Relational Object Queries) via `@sanity/client`.

### Content Models (Schemas)

#### 1. `event` (Events Page)
Stores information about club events, workshops, and competitions.
- **`title`** (String): Event Name.
- **`category`** (String): 'Workshops', 'Competitions', or 'Seminars'.
- **`status`** (String): 'Upcoming', 'Ongoing', or 'Past'.
- **`date`** (Datetime): When the event takes place.
- **`desc`** (Text): Description of the event.
- **`image`** (Image): Main banner for the event.
- **`link`** (URL): Registration or external link.
- **`venue`** (String): Location of the event.

#### 2. `post` (Blogs Page)
Stores technical articles and blogs written by members.
- **`title`** (String): Blog title.
- **`slug`** (Slug): URL-friendly string derived from the title.
- **`date`** (Datetime): Publish date.
- **`desc`** (Text): Short summary.
- **`image`** (Image): Cover image.
- **`author`** (Reference): Links to a `teamMember` document.
- **`content`** (Array of Blocks): Rich text content for the blog body.

#### 3. `project` (Projects Page)
Showcases technical projects developed by the community.
- **`title`** (String): Project name.
- **`shortDescription`** / **`description`** (String/Text): Overviews of the project.
- **`category`** (String): Domains like Web Dev, AI, ML, Cyber, etc.
- **`technologies`** (Array of Strings): Stack used.
- **`contributors`** (Array of Objects): Lists `name`, `role`, `github`, and `linkedin` for each contributor.
- **`demoLink`** / **`repoLink`** (URL): Links to live site and source code.
- **`gallery`** (Array of Images): Screenshots.
- **`featured`** (Boolean): Whether to highlight the project.

#### 4. `teamMember` (Team Page)
Profiles for CODEX members, coordinators, and alumni.
- **`name`** (String): Member's full name.
- **`role`** (String): e.g., "Frontend Developer", "Lead".
- **`memberId`** (String): Unique identifier.
- **`department`** (String): 'Coordinator', 'Team Leader', 'Core Member', 'Member', 'Alumni'.
- **`image`** (Image): Profile picture.
- **`socials`** (Array of Objects): Links to LinkedIn, GitHub, Twitter, etc., utilizing a custom `social` schema.

#### 5. `settings` (Site Settings)
Global configuration for the website, such as contact and social links.
- **`email`** (String): Official contact email address.
- **`instagram`** / **`linkedin`** / **`twitter`** (URL): Official organization social media links.
- **`otherLinks`** (Array of Objects): Additional links with `label` and `url`.

#### 6. `social` (Reusable Object)
A standardized object used across schemas (like `teamMember`) to store social media links with associated platform icons.
- **`platform`** (String): The platform icon identifier (e.g., 'link', 'camera', 'alternate_email', 'code', 'person', 'share').
- **`url`** (URL): The link to the social profile.

---

## Data Fetching & Frontend Integration

The frontend utilizes React's `useEffect` hook combined with `client.fetch()` to query Sanity on page load. State is managed via `useState` and fallback mock data (`src/data/mockData.ts`) is used if the fetch fails.

- **Home Page (`Home.tsx`):** 
  Fetches the latest 3 events/posts to populate the "Pulse of the Club" section.
  ```groq
  *[_type in ["event", "post"]] | order(date desc)[0...3]
  ```

- **Blogs Page (`Blogs.tsx`):** 
  Implements **pagination**. It first fetches the total count of posts `count(*[_type == "post"])`, then fetches a paginated chunk. It resolves the author reference to get the author's name and avatar.
  ```groq
  *[_type == "post"] | order(date desc) [0...6] { ..., author->{name, image} }
  ```

- **Events Page (`Events.tsx`):** 
  Fetches all events and sorts them locally based on status priority (Ongoing > Upcoming > Past) and then by date.

- **Projects Page (`Projects.tsx`):** 
  Fetches all projects ordered by creation date, processing image arrays and resolving nested contributors.

- **Team Page (`Team.tsx`):** 
  Fetches team members and groups/sorts them locally based on their department hierarchy (Coordinator > Team Leader > Core Member > Alumni > Member).

---

## Detailed Animation Design Flow

The animation architecture combines React's component lifecycle, Framer Motion's physics-based engine, and GSAP's timeline sequencer.

### 1. Global Ambient Animations (Always Active)
- **`AmbientBackground.tsx` (Canvas API):** Renders a 30-second looping animation in the background. It uses native HTML `<canvas>` to draw slowly rotating convergence grid lines and concentric ripple rings (resembling a sonar or radar). It lazily initializes to save performance and respects `prefers-reduced-motion`.
- **`CustomCursor.tsx` (Framer Motion):** Replaces the default cursor on desktop devices. It uses Framer Motion's `useMotionValue` and `useSpring` for smooth trailing physics. It tracks hovering states over clickable elements to expand into a ring. It also includes a "click burst" effect that spawns particles flying outwards at 45° angles whenever the user clicks.

### 2. Route & Page Transitions
- **`TransitionOverlay.tsx` (GSAP):** Triggers on every route change. It uses GSAP's timeline to create a "sweep" effect. It sweeps a blue overlay from the left (`clipPath: "inset(0 100% 0 0)"` to `0%`), briefly flashes the "CODEX" wordmark in the center, and then sweeps out to the right.
- **`PageTransition.tsx` (Framer Motion):** Wraps all page routes inside an `<AnimatePresence>` block in `App.tsx`. As the GSAP overlay plays, the page itself gracefully fades in/out and translates along the Y-axis (`y: -30` to `0`).

### 3. Page-Specific Micro-Interactions
- **Scroll Reveals (`ScrollReveal.tsx`):** Uses Framer Motion's `whileInView` to animate elements (fade up/in) sequentially as the user scrolls down the page. Includes `StaggerContainer` and `StaggerItem` for staggered list reveals.
- **3D Flip Cards (`Team.tsx` & `TiltCard.tsx`):** Team member cards utilize `transformStyle: "preserve-3d"` and `rotateY: 180`. Clicking a card flips it to reveal a back face with social links. Hovering over the cards also applies a 3D tilt effect (`TiltCard.tsx`) mapping mouse coordinates to rotation vectors.
- **Event Timeline (`Events.tsx`):** Events are presented on a vertical timeline. A `PulseNode` component uses an infinitely scaling and fading border (`scale: [1, 2.5], opacity: [1, 0]`) to highlight the active timeline nodes. A dashed vertical line dynamically draws itself down the page using `useScroll` and `useTransform` mapped to scroll progress (`scaleY`).
- **Hero Typing & Glitch Effects (`Home.tsx`):** 
  - `useTypingEffect`: A custom hook simulating a typewriter by slicing strings over an interval.
  - `AnimatedHeading`: Splits text into individual characters, fading and unblurring (`filter: "blur(0px)"`) them sequentially.
  - `SonarButton`: A button wrapped with an infinitely looping, scaling ring animation.
  - `FloatingCode`: Small code snippets (`</>`, `{}`, `//`) placed absolutely around the hero section, bobbing continuously using a mirrored, repeating animation.

---

## Summary
The CODEX website is a masterclass in modern, decoupled web development. It leverages Sanity CMS for robust, schema-driven content modeling, ensuring editors can manage complex data structures like events and projects. The frontend is heavily engineered for user experience, orchestrating data fetches with GROQ and presenting it through a highly kinetic, brutalist UI using a sophisticated blend of GSAP and Framer Motion.
