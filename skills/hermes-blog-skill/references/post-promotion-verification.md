# Post-promotion verification failure

## Observed failure

The controlled publisher deployed and promoted a production candidate, then exited with:

```text
Publication stopped: HTTP Error 404: Not Found
```

No `publication.json` was written, but the deployment result was `READY`, and the canonical article, blog listing, feed, sitemap, and public article URL were subsequently confirmed live.

## Correct response

1. Do not blindly rerun the deployment. Promotion may already have occurred.
2. Inspect `deployment-result.json` and the release manifest. Treat `publication.json` absence as unresolved publication state, not proof of failure or success.
3. Verify the candidate deployment and public canonical URL independently. Check the article metadata/canonical, blog listing, feed, sitemap, and asset URL as applicable.
4. Determine which exact route caused the 404. A route mismatch or propagation delay is different from a failed deployment.
5. If production is live but the publisher did not write its publication record, preserve the deployment evidence and report the publisher inconsistency. Do not hand-author a `publication.json` or claim that the publisher completed successfully unless the repository's publication contract explicitly permits recovery-record creation.
6. Synchronize GTM only to the strongest verified state: keep `preparing`/`blocked` when the publication contract is incomplete; move the marketing card and recurring run to `live`/`published` only when the required publication record and URL verification both exist.

The key distinction is between “promotion likely happened” and “the controlled publication workflow completed.” They are not interchangeable merely because the website is serving the page. Production systems enjoy this sort of ambiguity.
