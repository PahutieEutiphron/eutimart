# EutiMart — Weekend CTF Challenge

A deliberately vulnerable e-commerce web application built for security training. Your mission: find all **4 hidden flags**.

![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![Difficulty](https://img.shields.io/badge/Difficulty-Medium-orange) ![Flags](https://img.shields.io/badge/Flags-4-red)

## Overview

EutiMart is a premium tech store with a dark-themed UI, user accounts, a shopping cart, checkout, and profile management. Under the surface, it has 4 security vulnerabilities — each one guarding a flag in the format `FLAG{...}`.

These aren't your typical beginner CTF challenges. The vulnerabilities are **standard types** but they're hidden in places that require careful observation and logical thinking. You won't find them by running a scanner — you'll need to actually understand the application's behavior.

## Rules

- All flags follow the format: `FLAG{...}`
- No brute-forcing or automated scanning needed — use your brain and your proxy
- The source code is available, but it's been lightly obfuscated — reading it won't hand you the answers
- Every flag is obtainable through HTTP requests (no filesystem access, no server-side exploitation needed beyond what the app exposes)
- **Burp Suite (or any intercepting proxy) is strongly recommended**

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)

### Installation

```bash
git clone https://github.com/yourusername/eutimart.git
cd eutimart
npm install
npm start
```

The app will be running at **http://localhost:4000**.

### First Steps

1. Visit the store and browse around
2. Create an account, explore all features
3. Pay close attention to how the app handles requests — headers, cookies, responses
4. Use an intercepting proxy to inspect and modify traffic

## Hints (only if you're stuck)

<details>
<summary>Hint 1 — General</summary>
Not every endpoint enforces what the UI suggests.
</details>

<details>
<summary>Hint 2 — General</summary>
The app sets a lot of cookies. Most of them are noise. Focus on behavior, not decoration.
</details>

<details>
<summary>Hint 3 — General</summary>
Client-side restrictions are suggestions, not rules.
</details>

<details>
<summary>Hint 4 — General</summary>
The server sometimes tells you more than the browser shows you.
</details>

## Tech Stack

- **Backend:** Node.js, Express, EJS (server-rendered templates)
- **Auth:** Session-based (express-session)
- **Database:** In-memory (no external DB required)
- **Frontend:** Vanilla HTML/CSS/JS, dark theme

## Disclaimer

This application is **intentionally vulnerable**. It is designed for educational purposes and security training only. Do not deploy it on any public or production server. Use it in a controlled, local environment.

## License

MIT
