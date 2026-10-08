# Task 08: release and judge runbook

## Deploy to Vercel

Deployment was not performed for Task 08 because no Vercel account/project access or explicit deployment authorization was provided. Use these steps when the owner is ready to publish:

1. Push the reviewed commit to the authorized GitHub repository. In Vercel, choose **Add New → Project**, import that repository, and select the project root.
2. Keep the detected **Next.js** framework settings: install `npm install`, build `npm run build`, and output settings default. Set the Node.js version to **20.x** or later in Project Settings → General.
3. In Project Settings → Environment Variables, add `GEMINI_API_KEY` with the Gemini API key for **Production** and **Preview** only if previews are intended for judges. Add `GEMINI_MODEL=gemini-3.6-flash` (or a model enabled for that API account). Keep both server-side. Never use a `NEXT_PUBLIC_` prefix, commit `.env.local`, or place the key in a client setting.
4. Deploy to Production. In Vercel's deployment page, wait for Ready, open the generated HTTPS domain, and record that exact URL in the README only after the checks below pass. Do not claim B02 from a successful build alone.
5. In Vercel → Settings → Environment Variables, rotate or replace an exposed key, then redeploy after any environment change. Do not put candidate stories or other personal data into deployment logs or issue reports.

### Public smoke checks

Run these against the deployed URL, replacing `https://your-project.vercel.app` with the actual URL. The POST bodies below contain no candidate data and the invalid request must not call Gemini.

```sh
curl -i https://your-project.vercel.app/
curl -i -X POST https://your-project.vercel.app/api/conversation \
  -H 'Content-Type: application/json' \
  --data '{"action":"start","history":[],"questionStyle":"standard","extra":true}'
```

Expected: the page returns `200`; the API request returns `400` with `INVALID_REQUEST`. Then perform one genuine, fictional candidate journey in the browser: start with Simple or Standard selected, send a fictional answer, review and approve a grounded proposal, prepare a draft for a clearly fictional role, edit it, and download both text files. Confirm reset returns to welcome and deletes the local profile. Confirm a real Gemini response is visible before recording the URL as judge-ready. If the API key is absent, the route should return a typed `503 NOT_CONFIGURED`; do not represent that deployment as working AI.

Deployment is public and does not require judge login. Treat every submitted story as sensitive, use fictional details in evidence, and never expose `GEMINI_API_KEY` in browser code, screenshots, or logs.
