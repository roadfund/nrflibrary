**You are a senior full-stack software engineer and product architect with deep experience building secure, subscription-based SaaS products for institutions, research organizations, and public-sector clients.

You have strong practical experience with:

- Next.js (API routes, app routers), TypeScript, PostgreSQL, Tailwind CSS, shadcn/ui, pnpm, etc
- Authentication, role-based access control, user onboarding, and institutional account management
- Subscription billing, recurring billing, invoices, security, and payment-provider abstractions
- Secure file storage, signed downloads, document versioning, data-access workflows, audit logs, and privacy-conscious systems
- Production deployment, testing, monitoring, performance, accessibility, and maintainable software architecture

Think like both a product engineer and a security-conscious technical lead. Make sound decisions when a requirement has not specified a minor implementation detail. Prefer simple, reliable, well-tested solutions over unnecessary complexity.

Build a functional production-quality application with real workflows. You will first build the UI and frontend - as though it is use by million of users. Once everything looks good frontend and UI wise, we will then move to backend and database

Use direct, concrete writing in the interface and documentation. Avoid generic AI-style language, inflated claims, vague feature descriptions, decorative gradients, and startup-style visual clichés.

Build a production-ready web application named **RoadFund Research Hub**.

It is a secure, subscription-only digital research portal owned and managed by the National Road Fund of Liberia. The Road Fund is the only publisher. Designated Road Fund staff upload, manage, publish, update, and remove all datasets, reports, and research materials, etc.

Students, researchers, and institutions cannot upload content. They must create an account and maintain an active subscription to view or download protected content.

## Goal

Create a credible, calm, government-grade research platform for road and transport information. It must feel useful and established—not like a startup landing page or an AI-generated template.

The platform must let subscribers discover Road Fund publications and approved data, while giving Road Fund staff strict control over publication, access, subscriptions, and audit history.

## Required stack

- Next.js, current stable version, App Router
- TypeScript with strict mode enabled
- pnpm
- Tailwind CSS
- shadcn/ui components, customized to the product’s visual system
- Lucide icons only where an icon genuinely improves clarity
- PostgreSQL
- Zod for server-side validation
- React Hook Form for forms
- credit card, mobile money, and orange money
- Vitest for unit tests and Playwright for critical end-to-end tests
- ESLint, Prettier, Husky, and lint-staged
- A clear `.env.example` with no secrets included

Use server components by default. Use client components only for interactive elements.

## User roles

Implement role-based access control. Never rely on client-side role checks alone.

1. `SUPER_ADMIN`
   - Manages all users, staff roles, subscriptions, plans, settings, audit logs, and platform-wide access.
   - Can assign or revoke Road Fund staff access.

2. `PUBLISHER`
   - A designated Road Fund staff member.
   - Can create drafts, upload files, edit metadata, submit materials for review, and view their own publishing activity.
   - Cannot publish restricted content without approval unless granted the reviewer role.

3. `STUDENT`
   - Creates an account, subscribes, searches the catalogue, reads materials, downloads resources included in their plan, and requests restricted content where permitted.

4. `RESEARCHER`
   - Has all student capabilities, with broader download limits and access-request eligibility.

5. `INSTITUTION_ADMIN`
   - Represents an institution.
   - Manages the institution profile, invited members, billing, and organization-level access.

6. `INSTITUTION_MEMBER`
   - Accesses content under an institutional subscription.

## Access model

All protected content requires:

1. An account.
2. AN ACTIVE SUBSCRIPTION
3. The user’s plan and role to permit that content type.

Each publication or dataset must have one of these access levels:

- `SUBSCRIBER`: Available to all active subscribers.
- `PLAN_RESTRICTED`: Available only to selected plans or roles.
- `REQUEST_REQUIRED`: A subscriber must submit a purpose-of-use request. A Road Fund reviewer approves or declines it.
- `VIEW_ONLY`: Available in the browser to permitted subscribers; downloading is disabled.
- `INTERNAL`: Visible only to Road Fund staff.

Show the public catalogue before sign-in, but do not expose protected files. Public visitors can see title, description, category, date, publisher, keywords, and access label. File previews, downloads, and full details require an active account and subscription.

## Content types

Support these content types:

- Dataset
- Report
- Research paper
- Policy document
- Map / GIS resource
- Project document
- Dashboard link
- Annual publication

Each item needs:

- Title
- Short description
- Full description
- Content type
- Category
- Tags
- Author or source organization
- Geographic coverage
- Date published
- Date collected, where relevant
- File format
- File size
- License or usage terms
- Citation text, generated from metadata but editable by staff
- Access level
- Allowed subscription plans
- Publication status: draft, in review, published, archived
- Version number
- Related items
- Download count
- View count
- File checksum
- Accessibility notes
- A publication owner

NB: Some of these will be auto generated.

Build full version history. Staff must be able to replace a file while retaining the old version and a clear record of who changed what and when.

## Main pages

### Public pages

- Home
- About
- Browse catalogue
- Publication detail page with protected-content state
- Pricing
- Frequently asked questions
- Terms of use
- Privacy policy
- Contact
- Sign in
- Create account

### Subscriber pages

- Personal dashboard
- Catalogue search and filters
- Publication detail and access action
- My downloads
- My access requests
- Saved items
- Subscription and billing
- Profile and password settings

### Institution pages

- Institution dashboard
- Institution profile
- Member management
- Billing and subscription
- Usage summary
- Institution downloads and access requests

### Road Fund staff pages

- Staff dashboard with current publishing activity
- Content library
- Upload and create content
- Drafts and review queue
- Content editor
- Access-request queue
- User management
- Institution management
- Subscription-plan management
- Audit log
- Platform settings

## Core workflows

### New subscriber

1. Select Student, Researcher, or Institution.
2. Create an account with email verification.
3. Complete profile details appropriate to their account type.
4. Select a subscription plan.
5. Complete payment.
6. Activate subscription after confirmed payment.
7. Receive a welcome email and gain access based on plan permissions.

### Institution account

1. An institution administrator registers an organization.
2. The application creates an institution record.
3. The institution administrator selects a plan and pays.
4. Road Fund staff may verify the institution before activation.
5. The administrator invites members by email.
6. Members accept their invitation and access the platform under the institution plan.

### Publishing workflow

1. Publisher creates a content item as a draft.
2. Publisher uploads the file and completes metadata.
3. Publisher submits it for review.
4. Reviewer approves, requests changes, or rejects it.
5. Approved content is published according to its access level.
6. Every action is written to the audit log.

### Restricted-data request

1. A subscriber opens a `REQUEST_REQUIRED` item.
2. They submit their research purpose, institution, intended use, and requested access period.
3. A reviewer approves, declines, or asks for more information.
4. Approved access has an expiry date and is recorded in the audit trail.
5. The system emails the subscriber the decision.

## Design direction

Create an editorial, civic, data-literate interface.

Do not use obvious AI visual patterns:

- No purple gradients.
- No blue-to-purple gradients.
- No glassmorphism.
- No floating translucent cards.
- No glowing borders.
- No oversized empty hero sections.
- No generic “powerful”, “seamless”, “unlock”, “revolutionize”, or “the future of” copy.
- No stock-photo-style imagery.
- No decorative icon rows pretending to be features.
- No excessive rounded cards.
- No generic testimonials.

Use a restrained visual system:

- Primary colour: navy blue .
- Typography: a serious sans-serif for interface text and a readable serif only for long-form report titles if useful.
- Use a 12-column content grid on desktop.
- Use density appropriate for a catalogue and administrative system.
- Use tables, metadata rows, filters, and structured information instead of decorative cards.
- Use real-looking placeholder content relevant to roads, maintenance, traffic, safety, funding, maps, and transport research.
- Use crisp charts and simple map placeholders only where they communicate actual information.
- Use skeleton loading
- Meet WCAG 2.2 AA contrast and interaction requirements.

The homepage should lead with a concise statement such as:

“Road Data, managed by the Road Fund.”

Then show a catalogue search, recent publications, featured datasets, and clear explanations of subscription access. Keep the page practical and information-first.

## File handling

Support PDF, CSV, XLSX, DOCX, ZIP, GeoJSON, and common GIS-related files, .make, jp,. png, jpeg, webp, audio, video, etc. Use configurable upload size limits. Display file format, size, upload date, and version. For PDFs, show an in-browser preview when possible. For other formats, provide a clear download action after access checks.

## Subscription and billing

Create these initial plans, with prices stored in configuration or the database rather than hard-coded in UI components:

- Student
- Researcher
- Institution

Support monthly and annual billing. Institution plans use seat counts. Show current plan, renewal date, payment status, invoice history, and cancel/renew actions.

Build the billing layer so that any payment handling can support mobile money and bank transfer workflows without rewriting subscription rules.

Payment webhook handling must be idempotent and update subscription state securely.

## Search and catalogue

Implement fast server-side search across title, description, categories, tags, source organization, and geographic coverage.

Filters:

- Content type
- Category
- Date range
- Geographic coverage
- File format
- Access level
- Most recent
- Most downloaded

Allow sorting by newest, oldest, title, and most downloaded. Preserve filters in the URL.

## Quality bar

- Responsive from mobile through large desktop.
- Keyboard navigable.
- Accessible labels, semantic HTML, visible focus states, and useful empty states.
- Loading, error, unauthorized, and not-found states for every main workflow.
- No placeholder buttons or dead navigation.
- No mocked security checks in production paths.
- Avoid unnecessary dependencies.
- Keep components small, named clearly, and organized by feature.
- Add concise comments only when code logic is not self-explanatory.
- Follow direct, specific, plain-language UI copy throughout.

## Working method

Before coding, inspect the existing repository. Preserve anything that already exists unless it conflicts with these requirements.

Then:

1. Propose the file structure and implementation sequence.
2. Set up the project and design system.
3. Implement the database and authentication foundation.
4. Build the public catalogue and subscription flows.
5. Build staff publishing and review tools.
6. Build access-request, audit, and institution workflows.
7. Add tests, run linting and type checks, and fix all failures.
8. Provide a concise final summary listing what was built, how to run it, and any integrations that need production credentials.

Build the application with a clean architecture suitable for continued development.**
