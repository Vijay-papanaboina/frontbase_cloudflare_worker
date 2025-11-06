# Frontbase Cloudflare Worker

A Cloudflare Worker that serves static frontends from R2 based on subdomain. Subdomain → R2 folder prefix mapping is stored in KV. SPA routes fall back to `index.html`.

- Frontend repo: [Frontbase-Frontend](https://github.com/Vijay-papanaboina/Frontbase-Frontend.git)
- Backend repo: [Frontbase-Backend](https://github.com/Vijay-papanaboina/Frontbase-Backend.git)

## How It Works

- Extract subdomain from request host (e.g., `myapp.example.com` → `myapp`).
- Lookup `folderPrefix` in KV using `Frontbase_KV_Binding.get(subdomain)`.
- Build key `${folderPrefix}${pathname}` and serve from R2 via `R2Binding`.
- If not an asset and the object is missing, attempt SPA fallback to `${folderPrefix}/index.html`.

### Directory Structure

```
r2-worker/
  src/worker.js
  wrangler.toml
```

### Wrangler Bindings

Defined in `wrangler.toml`:

- R2 bucket
  - binding: `R2Binding`
  - bucket_name: `frontbase`
- KV namespace
  - binding: `Frontbase_KV_Binding`
  - id: (configured in toml)

## Local Setup

1. Install Wrangler:
   - npm i -g wrangler
2. Authenticate:
   - wrangler login
3. Ensure bindings in `wrangler.toml` point to your R2 bucket and KV namespace.
4. Dev:
   - wrangler dev

## Deployment

- Target: Cloudflare Workers
- Deploy:
  - wrangler deploy
- DNS:
  - Point your domain/subdomain to the Worker (Routes)
- KV data:
  - Ensure the backend populates KV:
    - key: subdomain
    - value: R2 folder prefix (e.g., `users/123/repos/app-abc/build`)

## Troubleshooting

- 404 Not Found:
  - KV key missing for subdomain or wrong prefix; verify KV values.
- Wrong MIME types:
  - MIME is inferred; verify your files/extensions.
- SPA deep-links 404:
  - Ensure non-asset paths fall back to `${prefix}/index.html` (implemented).
- Permissions:
  - Verify R2 and KV bindings exist in the deployed environment.

## Cross-Links

- Backend: https://github.com/Vijay-papanaboina/Frontbase-Backend.git
- Frontend: https://github.com/Vijay-papanaboina/Frontbase-Frontend.git

## License

MIT
