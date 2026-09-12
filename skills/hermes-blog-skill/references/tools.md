# Tools required on the receiving PC

Discover actual tool schemas after connecting; prefixes differ between clients. Names below are tool suffixes, not permission to guess arguments. Do not copy this computer's credentials.

| Connection | Tools / capability | Needed for |
|---|---|---|
| Snackbox, `https://snackboxcms.com/api/mcp` | `get_schema`, `query`, `get_document`, `create_documents`, `save_draft`, `publish_draft`, `check_site_setup` | Schema, coverage including drafts, revision-safe drafting, readiness and publishing |
| Snackbox media | `upload_asset_from_url`; authenticated multipart upload for local PNGs | Store the verified export, obtain asset IDs, original URL and variants |
| GTM Board, project `groomlocal` | `gtm_list_projects`, `gtm_list_cards`, `gtm_get_card`, `gtm_add_card`, `gtm_update_card`, `gtm_move_card`, `gtm_set_card_description`; `gtm_get_agent_task`, `gtm_update_agent_task`, `gtm_create_agent_task` | Per-article SEO card plus the existing recurring agent card |
| GTM Board Search Console connector | `gtm_status` for stored metrics; `gtm_refresh_channel` with `channel: "google_search_console"`, property `sc-domain:groomlocal.com` | Actual clicks, impressions and queries; recheck access and dates |
| DataForSEO | `dataforseo_labs_google_ranked_keywords`, `dataforseo_labs_google_keyword_overview` or `kw_data_google_ads_search_volume`, `serp_organic_live_advanced`, `serp_locations` | Rankings, candidate keyword batch, live SERPs and regional intent |
| DataForSEO, supplementary | `ai_opt_llm_ment_search`, `ai_opt_llm_ment_top_domains` or `ai_opt_llm_ment_top_pages`, `ai_optimization_chat_gpt_scraper`, `backlinks_bulk_ranks` | Bounded citation/authority checks; report unavailable endpoints without fabricating results |
| Source reader | Firecrawl scrape/search, or equivalent web fetch/browser | Open primary sources; snippets alone are not factual verification |
| Image generation | A reference-image-capable image tool, or the checked-in Gemini/OpenAI helpers | Generate a new Maui scene using the fixed approved reference |
| Vision / image viewer | Can actually inspect local reference, final PNG and browser-rendered images | Separate visual quality pass; text-only models cannot approve artwork |
| Browser | Desktop/mobile viewport, DOM/metadata inspection, image load/network checks | Preview and live verification, including optimized image URLs |
| Terminal / filesystem | Python 3.11+, Pillow, Git, Node.js and `uv` for the optional image helpers | Preflight, hashes, PNG checks, asset upload, evidence files |

Required credentials: a GroomLocal-scoped Snackbox **admin** token for MCP (the current MCP endpoint does not accept write-only tokens), GTM Board access, DataForSEO access, and whichever image provider is used. A separate project write token is sufficient for the media REST endpoint. Never give this job a platform-wide Snackbox token merely for convenience. Keep tokens in the receiving PC's secret store or ignored environment file.

Hermes supports an HTTP MCP configuration such as the following. This is an installation example; reading the skill does not authorize changing a bot or its credentials:

```yaml
mcp_servers:
  snackbox:
    url: https://snackboxcms.com/api/mcp
    headers:
      Authorization: "Bearer ${SNACKBOX_GROOMLOCAL_TOKEN}"
    timeout: 180
    connect_timeout: 60
    tools:
      include:
        - get_schema
        - query
        - get_document
        - create_documents
        - save_draft
        - publish_draft
        - upload_asset_from_url
        - check_site_setup
```

A project-scoped session may omit the `project` argument because the token fixes it. If the discovered schema accepts it, explicitly send `project: "groomlocal"`. This tool filter reduces accidental actions; it is not server-side collection-level authorization. Schema/configuration/membership changes and deletes are not needed by the weekly job.

For a **local** transparent PNG, do not send a local path to `upload_asset_from_url` and do not expose a temporary public file server. Use bundled `scripts/upload-cms-image.py` with `SNACKBOX_GROOMLOCAL_TOKEN` in its environment. It calls the documented project media endpoint with multipart `file` and `alt`, leaves document creation to MCP, and never prints the token. Save its JSON response; image fields take `{ "_ref": "<asset id>" }`, not the full response.

Before the first editorial run, perform a read-only connection test: `get_schema`, query authors/topics and all blog coverage, GTM read, one bounded SEO request, reference image inspection, and `check_site_setup`. Missing core tools block publication. Record the exact missing capability; do not change unrelated permissions, models, schedules or email tools.

## Other connection setup

- **DataForSEO:** use the account's authenticated MCP endpoint on `mcp.dataforseo.com`; use the account's issued connection URL/header rather than inventing an authentication format. Required endpoint families are listed above. Confirm available tools on that PC.
- **Firecrawl:** the local setup uses `npx -y firecrawl-mcp` with `FIRECRAWL_API_KEY` supplied by the receiving environment. An equivalent source reader is acceptable. Exa search is optional, not a substitute for opening the source.
- **GTM Board:** the custom server is in `https://github.com/MistaSnacks/GTM-Board`. Install its `server/` dependencies and follow that repository's current setup. The entrypoint is `server/src/index.ts` via `npx tsx`; set `GTM_HOME` to the receiving checkout, `DEFAULT_PROJECT=groomlocal`, and the existing account's `GTM_SUPABASE_URL` and `GTM_SUPABASE_SERVICE_ROLE_KEY` securely. Do not copy a machine-specific absolute path or initialize a different backing database. Reconnect its existing Search Console OAuth configuration as needed using the account's credentials; other ad/email/payment connectors are not required for this job.
- **Image providers:** use a reference-capable image tool, or the checked-in provider helpers with their documented key variables. Preserve the selected provider/model; do not change the bot's model while installing a skill. The receiving environment must also provide actual visual inspection.

The skill folder contains instructions and checks, not service credentials. Never place service-role keys, OAuth refresh tokens, or private configuration into a transferable archive.
