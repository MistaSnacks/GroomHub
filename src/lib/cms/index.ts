import { cms } from "./sdk";

const project = process.env.NEXT_PUBLIC_SNACKBOX_PROJECT || "groomlocal";
if (!project) throw new Error("NEXT_PUBLIC_SNACKBOX_PROJECT is not set — see .env.example");

// The SnackBox client for this site. Usage:
//   const items = await site.query("galleryItem").include("images").find();
// Always .include() any image/reference field so the API resolves it to a URL.
//
// editMode: when Next draft mode is on (an editor arrived via
// /api/snackbox-edit), reads become uncached and stega-annotated so the
// overlay can map on-page content to CMS fields — and, with the edit-token
// cookie that bootstrap set, they read the draft perspective, so the editor
// previews unpublished changes in place. Public rendering never takes this
// branch, and drafts are token-gated by the CMS on top.
export const site = cms(project, {
  baseUrl: process.env.NEXT_PUBLIC_SNACKBOX_URL || "https://snackboxcms.com",
  editMode: async () => {
    try {
      const { draftMode, cookies, headers } = await import("next/headers");
      // draftMode() first: unlike headers()/cookies() it does not opt the route
      // into dynamic rendering, so public pages stay static/ISR. The request
      // APIs are only touched inside an edit session.
      if (!(await draftMode()).isEnabled) return false;
      // sbx-public=1 (proxy.ts) renders published content for one request.
      if ((await headers()).get("x-sbx-public-view") === "1") return false;
      return (await cookies()).get("sbx-edit-token")?.value ?? true;
    } catch {
      return false; // browser or non-request scope
    }
  },
});
export { cms };
// Form spam guard — put these on every intake form. See the README's "Forms"
// section; formGuardFields() must be captured at render time, not on submit.
export { formGuardFields, honeypotInputProps, HONEYPOT_FIELD, RENDERED_AT_FIELD, SnackboxError, stegaClean } from "./sdk";
export type { FormGuardFields } from "./sdk";

export { editableField, editablePage } from "./sdk";
export type { PageDocument } from "./sdk";
