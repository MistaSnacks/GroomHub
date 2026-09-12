import Script from "next/script";
import { cookies, draftMode, headers } from "next/headers";
import { editablePage, type PageDocument } from "./sdk";

/** Render once per page with its actual document bindings and language. */
export async function SnackboxOverlay({ documents, locale }: { documents: PageDocument[]; locale?: string }) {
  // draftMode() first so public renders never touch headers()/cookies(),
  // which would opt every page into dynamic rendering.
  const editing = (await draftMode()).isEnabled;
  if (editing && (await headers()).get("x-sbx-public-view") === "1") return null;
  const draft = editing && !!(await cookies()).get("sbx-edit-token")?.value;
  const cms = process.env.NEXT_PUBLIC_SNACKBOX_URL?.replace(/\/$/, "");
  const project = process.env.NEXT_PUBLIC_SNACKBOX_PROJECT;
  if (!cms || !project) return null;
  return <span hidden data-sbx-page={project} data-preview={draft ? "draft" : "published"} {...editablePage(documents, locale)} />;
}

/** Load globally so the CMS's homepage entry can start an editing session. */
export async function SnackboxScript() {
  const editing = (await draftMode()).isEnabled;
  if (editing && (await headers()).get("x-sbx-public-view") === "1") return null;
  const draft = editing && !!(await cookies()).get("sbx-edit-token")?.value;
  const cms = process.env.NEXT_PUBLIC_SNACKBOX_URL?.replace(/\/$/, "");
  const project = process.env.NEXT_PUBLIC_SNACKBOX_PROJECT;
  if (!cms || !project) return null;
  return <Script id="snackbox-overlay" strategy="afterInteractive" src={`${cms}/overlay.js`} data-project={project} data-cms={cms}
    data-preview={draft ? "draft" : "published"} />;
}
