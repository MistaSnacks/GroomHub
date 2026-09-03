from playwright.sync_api import sync_playwright
import os
import json

SCREENSHOTS_DIR = "/Users/admin/GroomingBook Directory/pnw-grooming-directory/screenshots"

VIEWPORTS = {
    "desktop": {"width": 1920, "height": 1080},
    "mobile": {"width": 375, "height": 812},
}

PAGES = {
    "homepage": "https://groomlocal.com",
    "city-seattle": "https://groomlocal.com/dog-grooming/wa/seattle",
}

def capture_all():
    os.makedirs(SCREENSHOTS_DIR, exist_ok=True)
    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # First pass: capture homepage and city page at both viewports
        for page_name, url in PAGES.items():
            for vp_name, vp in VIEWPORTS.items():
                fname = f"{page_name}_{vp_name}.png"
                fpath = os.path.join(SCREENSHOTS_DIR, fname)

                is_mobile = vp_name == "mobile"
                context = browser.new_context(
                    viewport=vp,
                    is_mobile=is_mobile,
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" if is_mobile else None
                )
                page = context.new_page()
                try:
                    page.goto(url, wait_until="networkidle", timeout=30000)
                    page.wait_for_timeout(2000)  # let animations settle

                    # Above the fold screenshot
                    page.screenshot(path=fpath, full_page=False)
                    print(f"Captured: {fname}")

                    # Full page screenshot
                    full_fname = f"{page_name}_{vp_name}_full.png"
                    full_fpath = os.path.join(SCREENSHOTS_DIR, full_fname)
                    page.screenshot(path=full_fpath, full_page=True)
                    print(f"Captured: {full_fname}")

                    # Extract SEO and structural data
                    seo_data = page.evaluate("""() => {
                        const h1s = [...document.querySelectorAll('h1')].map(el => ({text: el.textContent.trim(), visible: el.offsetParent !== null}));
                        const h2s = [...document.querySelectorAll('h2')].map(el => el.textContent.trim());
                        const h3s = [...document.querySelectorAll('h3')].map(el => el.textContent.trim());
                        const imgs = [...document.querySelectorAll('img')].map(el => ({src: el.src?.substring(0,80), alt: el.alt, width: el.naturalWidth, height: el.naturalHeight}));
                        const links = [...document.querySelectorAll('a')].slice(0, 30).map(el => ({text: el.textContent.trim().substring(0,50), href: el.href}));
                        const ctas = [...document.querySelectorAll('a, button')].filter(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.top < window.innerHeight && rect.bottom > 0;
                        }).map(el => ({tag: el.tagName, text: el.textContent.trim().substring(0,50), top: Math.round(el.getBoundingClientRect().top)}));
                        const meta_desc = document.querySelector('meta[name="description"]')?.content || '';
                        const title = document.title;
                        const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
                        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => {
                            try { return JSON.parse(el.textContent); } catch { return null; }
                        }).filter(Boolean);
                        const nav = document.querySelector('nav');
                        const navLinks = nav ? [...nav.querySelectorAll('a')].map(a => a.textContent.trim()) : [];
                        const fontSize = getComputedStyle(document.body).fontSize;
                        return {title, meta_desc, canonical, h1s, h2s, h3s, imgs: imgs.slice(0,15), ctas: ctas.slice(0,15), jsonld, navLinks, fontSize};
                    }""")
                    results[f"{page_name}_{vp_name}"] = seo_data

                except Exception as e:
                    print(f"Error on {page_name} {vp_name}: {e}")
                finally:
                    context.close()

        # Find a groomer profile link from the Seattle page
        context = browser.new_context(viewport=VIEWPORTS["desktop"])
        page = context.new_page()
        page.goto("https://groomlocal.com/dog-grooming/wa/seattle", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(2000)

        groomer_link = page.evaluate("""() => {
            const links = [...document.querySelectorAll('a')];
            const groomerLink = links.find(a => a.href.includes('/groomer/'));
            return groomerLink ? groomerLink.href : null;
        }""")
        context.close()

        if groomer_link:
            print(f"Found groomer profile: {groomer_link}")
            for vp_name, vp in VIEWPORTS.items():
                fname = f"groomer-profile_{vp_name}.png"
                fpath = os.path.join(SCREENSHOTS_DIR, fname)

                is_mobile = vp_name == "mobile"
                context = browser.new_context(
                    viewport=vp,
                    is_mobile=is_mobile,
                    user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" if is_mobile else None
                )
                page = context.new_page()
                try:
                    page.goto(groomer_link, wait_until="networkidle", timeout=30000)
                    page.wait_for_timeout(2000)

                    page.screenshot(path=fpath, full_page=False)
                    print(f"Captured: {fname}")

                    full_fname = f"groomer-profile_{vp_name}_full.png"
                    full_fpath = os.path.join(SCREENSHOTS_DIR, full_fname)
                    page.screenshot(path=full_fpath, full_page=True)
                    print(f"Captured: {full_fname}")

                    seo_data = page.evaluate("""() => {
                        const h1s = [...document.querySelectorAll('h1')].map(el => ({text: el.textContent.trim(), visible: el.offsetParent !== null}));
                        const h2s = [...document.querySelectorAll('h2')].map(el => el.textContent.trim());
                        const h3s = [...document.querySelectorAll('h3')].map(el => el.textContent.trim());
                        const imgs = [...document.querySelectorAll('img')].map(el => ({src: el.src?.substring(0,80), alt: el.alt, width: el.naturalWidth, height: el.naturalHeight}));
                        const ctas = [...document.querySelectorAll('a, button')].filter(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.top < window.innerHeight && rect.bottom > 0;
                        }).map(el => ({tag: el.tagName, text: el.textContent.trim().substring(0,50), top: Math.round(el.getBoundingClientRect().top)}));
                        const meta_desc = document.querySelector('meta[name="description"]')?.content || '';
                        const title = document.title;
                        const canonical = document.querySelector('link[rel="canonical"]')?.href || '';
                        const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(el => {
                            try { return JSON.parse(el.textContent); } catch { return null; }
                        }).filter(Boolean);
                        const fontSize = getComputedStyle(document.body).fontSize;
                        return {title, meta_desc, canonical, h1s, h2s, h3s, imgs: imgs.slice(0,15), ctas: ctas.slice(0,15), jsonld, fontSize, url: window.location.href};
                    }""")
                    results[f"groomer-profile_{vp_name}"] = seo_data

                except Exception as e:
                    print(f"Error on groomer profile {vp_name}: {e}")
                finally:
                    context.close()
        else:
            print("No groomer profile link found!")

        browser.close()

    # Save results
    with open(os.path.join(SCREENSHOTS_DIR, "seo_data.json"), "w") as f:
        json.dump(results, f, indent=2, default=str)
    print("Done! SEO data saved.")

if __name__ == "__main__":
    capture_all()
