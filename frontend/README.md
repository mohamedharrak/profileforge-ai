# ProfileForge AI frontend

## Run locally

From this directory, run `npm install` and then `npm run dev`. Open the URL printed by Vite.

Enable **Demo Mode**, select **Load demo data**, and analyze to see fixed example results without a backend. Demo results are illustrative and do not analyze the entered text.

For live analysis, disable Demo Mode and run the separately developed backend. The frontend sends `POST /api/analyze` to `http://localhost:3001` by default. Set `VITE_API_BASE_URL` in a frontend `.env.local` file to use another backend base URL, then restart Vite. This variable is public browser configuration; never put secrets in it. The backend must allow requests from the frontend origin (CORS).

All fields are required. The job title is included in `jobDescription`, while the profile fields are combined into `profileText`. The response must contain nonempty `headline` and `about` strings and `skillGaps` and `suggestions` arrays of strings. Skills shown as present are taken from the user's skills field; missing evidence does not establish a lack of qualifications.

Run `npm run lint` and `npm run build` to validate the frontend.
