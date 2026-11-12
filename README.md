# Cyber Security Base 2026 Project
A web application, containing 5 security flaws (and fixes for them) from 5 categories from the OWASP Top 10.

[Hono](https://hono.dev/) application written in TypeScript with Node.js as the runtime.

## App
A simple notes app. Notes have their own page with a title and text,
which can be edited on the page.

## Installation

1. Install `npm` ([Guide](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)) or `bun` ([Guide](https://bun.com/docs/installation))
2. In the projects root folder, run `npm install` (or `bun install`) to install the dependencies
3. Build the project with `npm build`
4. Start the project with `npm start`

The project should now be running at `http://localhost:3000`

## Vulnerabilities

### List
Uses OWASP 2025 top 10 list:
1. [A01 Broken access control](https://top10.owasp.org/2025/A01_2025-Broken_Access_Control/)
2. [A05 Injection](https://top10.owasp.org/2025/A05_2025-Injection/)
3. [A07 Authentication failures](https://top10.owasp.org/2025/A07_2025-Authentication_Failures/)
4. [A09 Security Logging & Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/)
5. [A10 Mishandling of Exceptional Conditions](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/)
