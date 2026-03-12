# Scholar Portal

A production-ready Research Supervision Management System built with Next.js 14, Supabase, and AI-powered meeting summarization.

## Features

- **Role-Based Access** — Professor, Scholar, and Co-Supervisor dashboards with tailored views
- **Scholar Management** — Add, track, and monitor research scholars
- **Task Management** — Create tasks, assign to scholars, track submissions, and provide reviews
- **Meeting Management** — Schedule meetings, generate pre-meeting briefings, and manage participants
- **AI Meeting Summarization** — Automatically summarize transcripts with action items via Groq or OpenAI
- **Fathom Integration** — Import meeting transcripts from Fathom
- **Google Calendar Integration** — Auto-create calendar events when scheduling meetings
- **Activity Tracking** — Comprehensive activity logs across all platform actions
- **Notifications** — Real-time notification system for task assignments, reviews, and meetings

## Tech Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **UI**: TailwindCSS + ShadCN UI (Radix Primitives)
- **Database**: Supabase (PostgreSQL with RLS)
- **Auth**: Supabase Auth with SSR
- **AI**: Groq (Llama 3.1) or OpenAI (GPT-4o-mini)
- **Integrations**: Fathom API, Google Calendar API

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project
- Groq or OpenAI API key (for AI features)

### Setup

1. **Clone and install dependencies**:
   ```bash
   cd Scholar_Portal
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in your Supabase URL, keys, and API keys.

3. **Set up the database**:
   Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to create all tables, indexes, RLS policies, and functions.

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/                  # API routes
│   │   ├── auth/setup/       # User registration setup
│   │   ├── calendar/         # Google Calendar integration
│   │   ├── meetings/         # Meetings CRUD + summarize + transcript
│   │   ├── scholars/         # Scholar management
│   │   ├── tasks/            # Tasks CRUD + assignments + reviews
│   │   └── user/profile/     # User profile updates
│   ├── auth/callback/        # OAuth callback handler
│   ├── dashboard/            # Protected dashboard pages
│   │   ├── activity/         # Activity logs
│   │   ├── meetings/         # Meeting management
│   │   ├── notifications/    # Notifications
│   │   ├── scholars/         # Scholar management
│   │   ├── settings/         # User settings
│   │   ├── submissions/      # Submission review
│   │   └── tasks/            # Task management
│   ├── login/                # Login page
│   └── signup/               # Registration page
├── components/
│   ├── dashboard/            # Role-specific dashboard components
│   ├── layout/               # Sidebar and header
│   └── ui/                   # ShadCN UI components
└── lib/
    ├── services/             # AI, Fathom, Google Calendar services
    ├── supabase/             # Supabase client configurations
    ├── auth.ts               # Server-side auth helpers
    ├── types.ts              # TypeScript type definitions
    └── utils.ts              # Utility functions
```

## User Roles

| Feature | Professor | Scholar | Co-Supervisor |
|---|---|---|---|
| Dashboard | Full overview | Personal tasks & meetings | Assigned scholars |
| Scholars | Add, manage all | View own profile | View assigned |
| Tasks | Create, assign, review | View, submit work | View assigned scholars tasks |
| Meetings | Schedule, summarize | View, participate | View, participate |
| Submissions | Review all | Submit work | View assigned |

## Deployment

Deploy to Vercel:

```bash
npm run build
```

Set the same environment variables in your Vercel project settings.
