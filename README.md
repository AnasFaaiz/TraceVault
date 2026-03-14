# TraceVault

TraceVault is a **project-based engineering knowledge platform** where developers can document real debugging experiences, errors, solutions, and lessons learned while building software.

Instead of relying entirely on AI or forgetting solved problems, TraceVault helps developers build a **personal engineering knowledge base** that grows with every project.

---

# Purpose

Developers encounter many errors and challenges during development, but most of those solutions are quickly forgotten.

TraceVault solves this by allowing developers to store:

* errors encountered during development
* debugging steps
* root causes
* solutions implemented
* lessons learned

Over time this becomes a **structured engineering intelligence system**.

---

# Core Concept

TraceVault organizes information using a **project-based structure**.

```
User
 └── Projects
        └── Engineering Entries
```

Each entry captures a real engineering experience.

Example entry:

```
Problem:
JWT route returned 401 Unauthorized

Error:
Unauthorized

Cause:
Authorization header missing Bearer prefix

Solution:
Authorization: Bearer <token>

Lesson:
JWT authentication strategies extract tokens only from Bearer headers.
```

---

# Features

## Authentication

* User registration
* User login
* JWT authentication
* Protected routes
* Password hashing (bcrypt)

## Project Management

* Create project
* List user projects
* View project details
* Update project
* Delete project
* Project tech stack
* Project description

## Engineering Entry System

* Create debugging entry
* View entry
* List project entries
* Update entry
* Delete entry

Each entry stores:

* problem description
* error message
* cause analysis
* solution
* lesson learned
* tags
* timestamp

## Tagging System

* Add tags to entries
* Filter entries by tags
* Technology-based categorization

## Search & Filtering

* Search entries
* Filter by project
* Filter by tag
* Filter by technology

## Markdown Import

Developers can log errors in markdown files during development and import them later.

Example format:

```
Project: TraceVault Backend
Tags: jwt, auth

Problem: JWT route returned 401
Error: Unauthorized
Cause: Missing Bearer prefix
Solution: Authorization: Bearer <token>
Lesson: JWT authentication requires Bearer tokens
```

## Dashboard

* View all projects
* View recent entries
* Debugging history overview

## Knowledge Retrieval

Users can search past debugging experiences to quickly find solutions to problems they previously solved.

---

# Future Features

## VS Code Extension

Automatically capture:

* compiler errors
* runtime errors
* build failures

Users can save these directly into TraceVault.

## Git Integration

Extract debugging insights from commit messages.

## RAG Knowledge Retrieval

Use vector search to retrieve relevant debugging experiences from stored entries.

---

# Tech Stack

Backend

* NestJS
* PostgreSQL
* Prisma ORM
* JWT Authentication
* bcrypt

Frontend

* Next.js
* React
* TailwindCSS

---

# Project Structure

```
TraceVault
 ├── backend
 │    ├── src
 │    ├── prisma
 │    └── package.json
 │
 ├── frontend
 │    ├── app
 │    └── package.json
 │
 └── docs
      └── debugging-log.md
```

---

# Development Roadmap

Phase 1 (MVP)

* Authentication
* Project management
* Engineering entries
* Basic dashboard

Phase 2

* Search and filtering
* Markdown import
* Entry tagging

Phase 3

* VSCode extension
* Automated error capture
* RAG-based knowledge retrieval

---

# Why TraceVault

TraceVault encourages developers to **think deeply about engineering problems**, rather than simply copying solutions.

Benefits:

* structured debugging knowledge
* better learning retention
* real engineering portfolio
* reusable problem-solving knowledge

---

# License

MIT License
