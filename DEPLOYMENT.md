# Deploying to Vercel

Import the repository with the project root set to the repository root. The root `vercel.json` builds the Vite frontend and routes `/api/*` to the FastAPI function. Do not set the Vercel root directory to `frontend` or override the build/output settings.

In the Vercel project settings, configure these environment variables for each environment you deploy:

- `DATABASE_URL`: a publicly reachable PostgreSQL connection string using the `postgresql+psycopg://` scheme, typically with `?sslmode=require`. Localhost refers to the Vercel function itself and cannot reach your computer. URL-encode special characters in credentials.
- `GEMINI_API_KEY`: a valid Gemini API key.
- `GEMINI_MODEL`: optionally override the backend default.

Leave `VITE_API_BASE_URL` unset or empty to use the same-origin API. Remove any existing production value pointing to localhost or a different backend and redeploy: Vite embeds this value at build time. Never put database credentials or API keys in a `VITE_` variable.

Initialize the target database with the desired schema and data. The application also creates the history objects described in `database/README.md`; its database role needs the permissions documented there. Redeploy after changing environment variables. Check `/api/health` for the function and `/api/health/database` for database connectivity, then test SQL generation, validation, and execution in the app. A healthy function alone does not establish that the database or Gemini is configured.

The app currently has a shared single-user history and no authentication. Only deploy it where access to the app and database is appropriately controlled.
