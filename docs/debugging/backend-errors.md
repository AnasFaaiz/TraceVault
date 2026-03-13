# TraceVault – Backend Development Debug Log

This document records the **engineering problems encountered while building the TraceVault backend**, along with their causes, solutions, and lessons learned.

TraceVault itself is designed to help developers **capture debugging experiences, design decisions, and lessons learned during real project development**.
This file represents the **first dataset of engineering knowledge collected during development**.

---

# Project Overview

**Project:** TraceVault Backend
**Purpose:** Platform for developers to record project errors, debugging steps, and engineering insights.

Backend stack:

* Framework: NestJS
* Database: PostgreSQL
* ORM: Prisma
* Authentication: JWT + Passport
* Password Security: bcrypt
* Config Management: NestJS ConfigModule
* Runtime: Node.js

Current backend endpoints:

```
POST /auth/register
POST /auth/login
GET  /auth/me
```

---

# Entry 1 – PostgreSQL Peer Authentication Failure

Date: 2026-03-13
Category: Database
Tags: postgres, authentication

## Problem

Unable to connect to PostgreSQL using:

```
psql -U postgres
```

## Error

```
FATAL: Peer authentication failed for user "postgres"
```

## Cause

PostgreSQL was configured with **peer authentication**, meaning the system user must match the database user.

## Solution

Login using the system postgres user:

```
sudo -u postgres psql
```

Alternatively configure password authentication.

## Lesson

PostgreSQL authentication modes include:

* peer
* md5
* password
* trust

Understanding these modes is important when configuring local development environments.

---

# Entry 2 – Database Already Exists

Category: Database
Tags: postgres

## Problem

Attempted to create a database named `tracevault`.

## Error

```
ERROR: database "tracevault" already exists
```

## Cause

The database had already been created earlier.

## Solution

Connect to the existing database instead of recreating it.

```
\c tracevault
```

## Lesson

Always verify the current database state before attempting to create new resources.

---

# Entry 3 – Prisma Shadow Database Permission Error

Category: ORM / Database
Tags: prisma, migration

## Problem

Running Prisma migration failed.

## Error

```
Prisma Migrate could not create the shadow database
ERROR: permission denied to create database
```

## Cause

Prisma migrations create a **shadow database** for schema comparison.
The PostgreSQL user used by Prisma lacked **CREATE DATABASE permission**.

## Solution

Grant permission to the database user.

```
ALTER USER admin CREATEDB;
```

## Lesson

Prisma migrations require additional privileges during development.

---

# Entry 4 – Prisma v7 Configuration Issue

Category: ORM
Tags: prisma, versioning

## Problem

Prisma schema validation failed.

## Error

```
The datasource property `url` is no longer supported in schema files
```

## Cause

Prisma version 7 introduced configuration changes incompatible with the existing setup.

## Solution

Downgraded Prisma to version 6.

```
npm uninstall prisma @prisma/client
npm install prisma@6 @prisma/client@6
```

## Lesson

Major library upgrades may introduce breaking configuration changes.

---

# Entry 5 – Prisma Client Not Initialized

Category: ORM
Tags: prisma

## Problem

NestJS application failed to start.

## Error

```
@prisma/client did not initialize yet.
Please run "prisma generate"
```

## Cause

Prisma client had not been generated after installing dependencies.

## Solution

Generate Prisma client.

```
npx prisma generate
```

## Lesson

The Prisma workflow requires:

```
npx prisma migrate dev
npx prisma generate
```

---

# Entry 6 – Prisma Client Generated in Wrong Location

Category: ORM
Tags: prisma, configuration

## Problem

Prisma client was generated to:

```
generated/prisma
```

instead of the default location.

## Cause

A `prisma.config.ts` file enabled a different generator configuration.

## Solution

Removed the configuration file and restored default generator settings.

```
rm prisma.config.ts
```

Schema generator:

```
generator client {
  provider = "prisma-client-js"
}
```

Then regenerate the client.

```
npx prisma generate
```

## Lesson

Configuration files can override default Prisma behavior.

---

# Entry 7 – NestJS Dependency Injection Failure

Category: Framework
Tags: nestjs, dependency-injection

## Problem

Application failed during startup.

## Error

```
Nest can't resolve dependencies of the UsersService (PrismaService)
```

## Cause

`PrismaService` was not available inside `UsersModule`.

NestJS dependency injection requires services to be provided through modules.

## Solution

Import `PrismaModule` inside `UsersModule`.

```
@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
```

## Lesson

NestJS dependency injection is **module scoped**, so modules must explicitly import dependencies.

---

# Entry 8 – Route Returning 404

Category: API
Tags: nestjs, http

## Problem

Visiting the endpoint returned:

```
404 Not Found
```

## Cause

The browser sends a **GET request**, but the endpoint supports only **POST**.

```
@Post('register')
```

## Solution

Send a POST request using curl or API clients.

Example:

```
curl -X POST http://localhost:3000/auth/register \
-H "Content-Type: application/json" \
-d '{"email":"anas@test.com","password":"password123","name":"Anas"}'
```

## Lesson

Always check the **HTTP method** when debugging route errors.

---

# Entry 9 – Incorrect Authorization Header

Category: Authentication
Tags: jwt, auth

## Problem

Protected endpoint returned:

```
401 Unauthorized
```

## Cause

Token was sent without the required `Bearer` prefix.

Incorrect header:

```
Authorization: <token>
```

Correct format:

```
Authorization: Bearer <token>
```

## Solution

Send the request with the proper authorization header.

```
curl http://localhost:3000/auth/me \
-H "Authorization: Bearer <JWT_TOKEN>"
```

## Lesson

JWT authentication strategies usually expect the **Bearer token scheme**.

---

# Entry 10 – Incorrect Terminal HTTP Request

Category: API Testing
Tags: curl

## Problem

Terminal displayed:

```
Please enter content (application/x-www-form-urlencoded) to be POSTed
```

## Cause

The HTTP request tool expected form data input instead of JSON.

## Solution

Use curl with proper headers.

```
curl -X POST http://localhost:3000/auth/login \
-H "Content-Type: application/json" \
-d '{"email":"anas@test.com","password":"password123"}'
```

## Lesson

Always specify `Content-Type: application/json` when sending JSON payloads.

---

# Entry 11 – Hardcoded JWT Secret

Category: Security
Tags: jwt, config

## Problem

JWT secret was hardcoded in the application.

```
secret: 'supersecretkey'
```

## Cause

Secrets stored directly in code pose security risks.

## Solution

Move secrets to `.env` and use NestJS ConfigModule.

`.env`

```
JWT_SECRET=supersecretkey
JWT_EXPIRES=7d
```

## Lesson

Production applications should store secrets in environment variables.

---

# Current Backend Milestone

The authentication system for TraceVault is fully operational.

Completed features:

```
✔ User Registration
✔ Password Hashing
✔ Login Authentication
✔ JWT Token Generation
✔ Protected Routes
✔ Environment-Based Secrets
```

---

# Next Development Phase

Upcoming backend modules:

```
Projects
Entries
Search / Retrieval
```

Planned domain structure:

```
User
 └── Projects
        └── Entries
```

Entries will capture:

* engineering errors
* debugging steps
* design decisions
* lessons learned

This dataset will eventually power **TraceVault's knowledge retrieval and RAG system**.

