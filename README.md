# ProctorFE

Frontend for an online proctoring system built with Next.js (App Router).  
It provides student exam session flows and admin monitoring views.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## Features

- Student authentication and token-based session flow
- Live exam page with camera stream and periodic frame upload
- Tab-switch event reporting during active sessions
- Session exit action from the exam view
- Admin dashboard to list sessions
- Dedicated admin event-log page per session

## Environment

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Run Locally

```bash
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Available Routes

- `/` - Landing page
- `/login` - User login
- `/student/exam` - Student exam session
- `/admin/dashboard` - Admin sessions overview
- `/admin/sessions/[sessionId]/events` - Session event logs

## Backend Endpoints Used

- `POST /auth/login`
- `POST /sessions/start?exam_id=1`
- `POST /events?session_id={id}&event_type=TAB_SWITCH&severity=1`
- `POST /cv/analyze-frame?session_id={id}`
- `GET /admin/sessions`
- `GET /admin/sessions/{session_id}/events`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint
