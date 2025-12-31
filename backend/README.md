# Blog Updation Automation Platform

This repository contains a **multi-phase full‑stack project** built as part of the *BeyondChats – Full Stack Web Developer Intern Assignment*.  
The system automates scraping, rewriting, and publishing blog content using web scraping, Google search signals, and Large Language Models (LLMs).

> **Status Note**  
> Phase 1 and Phase 2 are fully implemented and functional.  
> Phase 3 (React frontend) is scaffolded/planned and will be completed post‑submission due to time constraints.

---

## Project Phases Overview

### Phase 1 – Article Scraping & CRUD API
- Scrapes the **5 oldest articles** from the BeyondChats blog.
- Stores articles in a PostgreSQL database.
- Provides complete CRUD APIs to manage articles.

### Phase 2 – Content Automation Pipeline (Core Logic)
A Node.js pipeline that:
1. Fetches articles from Phase 1 APIs.
2. Searches the article title on Google.
3. Extracts top‑ranking external blog/article links.
4. Scrapes the **main content** from at least two valid sources.
5. Uses an **LLM** to rewrite the original article using insights from references.
6. Appends **citations** for reference articles.
7. Publishes the updated article back via CRUD APIs.

### Phase 3 – Frontend (Planned)
- ReactJS frontend to display:
  - Original articles
  - Updated (rewritten) articles
- Responsive, professional UI
- Will be added shortly after submission.

---

## Tech Stack

**Backend**
- Node.js (>=18)
- Express
- PostgreSQL
- Cheerio + Axios (scraping)
- Google/DuckDuckGo SERP parsing
- LLM APIs (HuggingFace / Groq – pluggable)

**Frontend (Planned)**
- ReactJS
- Axios
- Responsive UI

---

## Local Setup Instructions

### Prerequisites
- Node.js >= 18
- PostgreSQL + pgAdmin

### Backend Setup
```bash
git clone <repo-url>
cd backend
npm install
```

Create a PostgreSQL database:
```sql
CREATE DATABASE blog_api;
```

Run the schema file:
```sql
-- schema.sql
```

Create `.env` file:
```env
DATABASE_URL=postgres://user:password@localhost:5432/blog_api
BASE_URL=http://localhost:3000
LLM_PROVIDER=groq
GROQ_API_KEY=your_api_key_here
```

Start the server:
```bash
npm start
```

---

## API Endpoints

### Articles
- `POST /articles/scrape` – Scrape BeyondChats articles
- `POST /articles` – Create article
- `GET /articles` – Get all articles
- `GET /articles/:id` – Get article by ID
- `PUT /articles/:id` – Update article
- `DELETE /articles/:id` – Delete article

---

## Content Automation Pipeline (Phase 2)

Run the pipeline:
```bash
npm start
```

Pipeline Flow:
```
BeyondChats API
      ↓
Google Search
      ↓
External Blog Scraping
      ↓
LLM Rewrite
      ↓
Updated Article Publish
```

### Key Design Decisions
- Retry‑based scraping to ensure **minimum 2 valid reference articles**
- Fallback logic for blocked websites (403/anti‑bot)
- Token‑safe chunking for LLM requests
- Pluggable LLM provider architecture

---

## Architecture Diagram (Textual)

```
[BeyondChats Blog]
        ↓
[Scraper Service]
        ↓
[PostgreSQL]
        ↓
[CRUD APIs]
        ↓
[Content Automation Pipeline]
        ↓
[Google Search → Scrapers]
        ↓
[LLM Rewrite Engine]
        ↓
[Updated Article Storage]
```

---

## Frontend Status (Phase 3)

- React frontend planned
- Will fetch from existing APIs
- Live link will be added after UI completion

---

## Submission Notes

- Repository is public and commit history is preserved.
- Code is modular and extensible.
- Frontend is intentionally deferred to prioritize core automation logic.
- Additional improvements and UI will be pushed post‑submission.

---

## Author

**Bhoumish Grover**  
Full Stack / ML‑oriented Developer  
Assignment Submission – BeyondChats

---

## License
This project is submitted strictly for evaluation purposes.