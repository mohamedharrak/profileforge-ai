# ProfileForge AI

ProfileForge AI helps job seekers improve a pasted LinkedIn profile for a target job. It produces a suggested headline and About section, highlights job requirements not evidenced in the profile, and offers actionable recommendations. Review all output for accuracy before using it.

## Features and architecture

- React + Vite frontend: profile and target-job form, before/after comparisons, copy buttons, validation, loading and error states.
- Explicit Demo Mode shows fixed examples without contacting the backend. Live Mode never falls back to examples.
- Express API sends the submitted text and selected LinkedIn Profile Optimizer instructions to Google GenAI in one model request, then validates the response.
- Optional LinkedIn connection imports the signed-in member's name with consent. Paste the profile URL and profile details manually; URLs are not fetched. The application does not scrape, modify or publish to LinkedIn and does not persist submitted profiles in an application database.

## Setup

Requires Node.js 20.19+ or 22.12+ (a current LTS release is recommended), npm, and a Google Gemini API key with access to the configured model.

In one terminal:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
# Edit .env and set GEMINI_API_KEY to your key.
npm start
```

In another terminal:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open the local URL printed by Vite. The default backend is `http://localhost:3001`. For testing without a key, enable Demo Mode and click Load demo data. Run `npm test` in backend and `npm run lint` / `npm run build` in frontend.

## Environment

Backend `.env` (never commit it):

- `GEMINI_API_KEY`: server-side Google Gemini API key.
- `AI_MODEL`: a Gemini model supporting system instructions and JSON structured output; `gemini-3.5-flash-lite` is the example and was tested with an available key. Availability and quotas depend on the Google project. Gemma is not assumed to support these features.
- `PORT`: optional, defaults to `3001`.
- `FRONTEND_ORIGIN`: optional exact additional origin for a separately hosted frontend. Localhost and 127.0.0.1 development origins with ports are allowed.
- `LINKEDIN_CLIENT_ID`: LinkedIn application client ID.
- `LINKEDIN_CLIENT_SECRET`: server-side LinkedIn application client secret.
- `LINKEDIN_REDIRECT_URI`: exact registered backend callback URL ending in `/api/linkedin/callback`.

Frontend `.env`:

- `VITE_API_BASE_URL`: API origin; defaults to `http://localhost:3001`. Never put an API key in frontend environment variables.

Changing backend environment settings requires restarting the backend; restart Vite after frontend environment changes.

## Connect LinkedIn

In the LinkedIn Developer Portal, configure an application with the **Sign in with LinkedIn using OpenID Connect** product and register the exact callback URL. Set `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_REDIRECT_URI`, and `FRONTEND_ORIGIN` on the backend; `FRONTEND_ORIGIN` must be the exact frontend origin. HTTPS is required except for localhost or 127.0.0.1 development. Allow popups to connect. The app requests only `openid` and `profile` and imports the name returned by the official userinfo endpoint. It does not import a profile URL, headline, About, experience or skills. Paste those details yourself, whether or not LinkedIn access is configured. No imported data is sent to the AI provider until you choose Analyze. In Live Mode, analysis sends the submitted data to the configured AI provider.

LinkedIn product access and valid credentials are required for a real connection. OAuth state is held in backend memory for ten minutes and is lost on restart; a single server instance is required. See [LinkedIn's OpenID Connect documentation](https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2) and [authorization code flow](https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow).

## API

`GET /api/health` returns `{ "status": "ok" }`.

`POST /api/analyze` accepts JSON:

```json
{ "profileText": "Pasted profile text of at least 30 characters", "jobDescription": "Target job description of at least 30 characters" }
```

The successful response contains exactly:

```json
{ "headline": "Suggested headline", "about": "Suggested About section", "skillGaps": ["Requirement not evidenced"], "suggestions": ["Actionable recommendation"] }
```

Invalid input returns 400, oversized JSON 413, provider rate limits 429, missing AI configuration 503, and other provider or invalid-response failures 502. Errors return an `error` string. The backend limits profile text to 12,000 characters, job description to 10,500 characters and JSON requests to 32 KB.

## LinkedIn skills and credits

The server reads selected sections from `backend/skills/linkedin-profile-optimizer/SKILL.md` and its headline, About, and experience/skills references at startup. Its own instructions adapt them to job seeking and override unsupported benchmarks and any request to invent metrics. The humanizer principle of clear, natural wording and the interviewer principle of requesting real missing achievements are included in the same model call; their skill files are not loaded. The other locally copied skills are not used. The optimizer files must be included when sharing or deploying the project.

LinkedIn skills are instruction documents, not executable APIs. Source: [sergebulaev/linkedin-skills](https://github.com/sergebulaev/linkedin-skills), distributed under the MIT license; see `backend/skills/LICENSE-source.txt`. The tracked `profile-optimizer.md` is an earlier standalone copy and is not loaded.

## Limitations and privacy

Live analysis sends the submitted profile and job description to Google; consult Google's applicable data terms before submitting sensitive information. The application does not log profile text or store it in a database. Model-generated output can still contain unsupported claims or misidentify requirements despite prompt and shape validation. Review every suggestion, especially claims of skills, achievements and metrics. Model availability, rate limits and response quality depend on the provider. This MVP has no authentication or production abuse controls and is intended for local development and demonstrations.
