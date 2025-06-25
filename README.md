# JustPing 2.0 – AI Assistant Platform

JustPing 2.0 is an AI-based platform for building, deploying, and managing intelligent assistants capable of scalable, multi-channel conversations. Designed for modern businesses, it enables seamless integration with messaging platforms, robust automation, and deep analytics.

## Key Features

- **AI-Powered Conversations:** Scalable, context-aware chatbots and assistants
- **Multi-Platform Support:** Integrate with WhatsApp, web, and more
- **Modular API Architecture:** Organized by business domains (Agents, Contacts, Campaigns, etc.)
- **AgentsFlow System:** Advanced conversation flow management and automation
- **Database Layer:** PostgreSQL with Knex.js migrations
- **Authentication:** Secure, with Firebase Admin SDK
- **Background Processing:** Worker-based job handling
- **Comprehensive Documentation:** Auto-generated docs in `docs/PROJECT_STRUCTURE.md`

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- (Optional) OpenAI API key for advanced AI features

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`
4. Run database migrations:
   ```bash
   npm run migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure
- `api/` – Modular API endpoints (Agents, Contacts, Campaigns, etc.)
- `AgentsFlow/` – AI conversation flow engine
- `src/` – Next.js frontend (dashboard, onboarding, etc.)
- `system/` – Core backend logic, models, and providers
- `migrations/` – Database migrations and seeds
- `public/` – Static assets
- `docs/` – Documentation and architecture guides

See `docs/PROJECT_STRUCTURE.md` for a full, auto-generated breakdown.

## Documentation
- **Project Structure:** `docs/PROJECT_STRUCTURE.md`
- **API Reference:** See module-level docs in `api/` and `AgentsFlow/`
- **Team Inbox API:** `api/TeamInbox/README.md`

## Contributing
1. Fork the repo
2. Create a feature branch
3. Commit and push your changes
4. Open a pull request

## License
MIT License. See `LICENSE` for details.