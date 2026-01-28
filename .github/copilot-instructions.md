# Copilot Instructions for Move Across the Prairie

This is a secure Next.js web application for managing curriculum materials and lesson plans for teachers in GPISD.

## Project Overview

- **Type**: Full-stack Next.js application
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Email + activation code system

## File Structure Guide

Key directories:
- `src/app/` - Next.js pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and helpers
- `prisma/` - Database schema and migrations
- `src/styles/` - Global styles and Tailwind config

## Common Tasks

### Adding a New Page
1. Create file in `src/app/[feature]/page.tsx`
2. Use the existing pages as templates
3. Import components from `src/components/`

### Modifying the Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:push` to sync

### Adding API Endpoints
1. Create file in `src/app/api/[feature]/route.ts`
2. Use existing API files as patterns

### Styling
- Use Tailwind CSS classes (configured in `tailwind.config.ts`)
- Custom utilities defined in `src/styles/globals.css`

## Getting Help

- Check existing code for patterns
- Review the README.md for overview
- Look at similar pages for examples
- Database schema is in `prisma/schema.prisma`
