import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { BrowseByServiceSection } from "@/components/browse-by-service-section";
import { BrowseBySpecialtySection } from "@/components/browse-by-specialty-section";

const hiddenInitialStyle = /style="[^"]*(?:opacity:\s*0(?:[;"]|\s)|visibility:\s*hidden|display:\s*none)/;

test("homepage service and specialty links do not wait for a scroll-triggered reveal", () => {
  for (const html of [
    renderToStaticMarkup(createElement(BrowseByServiceSection, {})),
    renderToStaticMarkup(createElement(BrowseBySpecialtySection, {})),
  ]) {
    assert.match(html, /<a [^>]*href="\/(?:services|specialties)\//);
    assert.equal(hiddenInitialStyle.test(html), false, "Initial HTML hides browse links with opacity:0.");
  }
});

