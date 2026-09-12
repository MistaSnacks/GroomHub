# Pricing, booking, and controlled signup follow-up

September 12, 2026. This follow-up addresses the data and authenticated-owner gaps in the [initial walkthrough](report.md).

## Published data corrections

Reviewed all 36 records with numeric prices and all 76 populated booking destinations in the 1,178-record directory snapshot. Corrected 95 distinct records, including related duplicates and contact information confirmed while checking the destinations:

- Cleared 31 unsupported numeric price ranges. Unknown prices display “Ask for a quote.”
- Corrected five starting prices, without inventing a maximum. The five records include Sarah's duplicate, which now redirects to the primary profile.
- Removed 55 misleading or unusable booking links and set or replaced 10 booking links. These field counts overlap across records.
- Corrected verified addresses, phone numbers, and business identities where imported data pointed to another business or state. Removed confirmed placeholder contacts and contaminated descriptions/images in the affected records.
- Redirected Sarah's duplicate and the duplicate Best In Show profile to their canonical records. Retained underlying records. Excluded the confirmed closed Young Style listing from public discovery.

Examples: Floof's $20–$2,000 range represented gift cards; DogSpaw's prices came from an olive-oil store; Viva La Pooch's expired domain displayed pizza content. Bows and Biscuits and Cute Cuts had image URLs in booking fields. Jackie's Clip Joint pointed to another business's Facebook page. Replacements use the business's actual booking portal or appointment-request instructions. Verified website and Facebook contacts are clickable even on unclaimed profiles.

The exact changes, reasons, and source URLs are recorded in [data-repairs.json](../../../../output/signup-data-repair-2026-09-12/data-repairs.json). Private before-state backups remain outside deployed source. Each write checked the original record before applying its patch, then verified the result and preservation of unrelated fields. All 95 records passed a final read verification; the later Cute Cuts description correction was separately verified.

## Owner experience

The dashboard now exposes a booking/request URL, starting grooming price, and optional maximum. Instructions exclude gift cards and small add-on services. Server validation rejects image/map destinations, unsafe URL schemes, negative or fractional prices, and a maximum below the minimum. Older forms preserve existing commerce data. Price labels and structured data represent open-ended starting prices correctly. Owner saves, claims, and unclaims invalidate cached listing data.

Sarah's existing authorized test account passed real authentication, dashboard access, unclaim, reclaim confirmation, save validation, and public-profile verification. Invalid image booking URLs were rejected without changing saved data. Saving valid pricing and booking information succeeded. All 25 photos and the logo were preserved. No account was deleted or recreated; reclaiming updated the claim timestamp. This test used an admin-generated authentication link without sending email, so it does not establish email delivery.

The user subsequently requested a separate real public signup test through Hermes using the Tailor identity. Its sanitized results are saved in the task's `hermes-tailor/` directory. The final result is recorded below after completion.

## Validation and limits

The scoped release passes TypeScript and the Vercel production build. Changed-file lint has no errors; existing unrelated schema warnings remain. Owner commerce validation tests cover open-ended prices, invalid values and destinations, and compatibility with older forms. Six real owner-flow checks passed. Public browser checks cover nine affected mobile profiles, canonical redirects, a closed-profile 404, and duplicate-free Sarah search results. Final public results and deployment are recorded below.

The Cute Cuts profile exposed a long imported image URL in its description. Its description was corrected and the profile now constrains its mobile width and wraps long text. This prevents malformed imported prose from expanding the viewport.

This is not verification of every business identity in the directory. Some imported records still need identity, service, photo, and current-location review; DogSpaw Burien has no verified current branch contact. The previous walkthrough's ownership-verification policy and manual-request handling questions remain operational launch decisions. External booking pages were opened and checked, but no appointments, contact requests, or payments were submitted.

## Final results

All 13 live public checks passed, including nine mobile profiles, two permanent redirects, the closed-profile 404, and canonical Sarah search. Cute Cuts now measures 390px of content at a 390px viewport. One initial DogSpaw browser navigation timed out; a direct request subsequently returned HTTP 200 in 1.52 seconds and the complete browser rerun passed.

Final deployment: `dpl_DTLi4zDTorS27Qt6bmDPDDnRYeE1`. All 481 deployed source-file hashes matched the reviewed isolated release. The workspace received scoped three-way merges; unrelated changes were preserved.

Hermes completed a real public signup as Tailor using `camren@gettailor.ai`. The mobile form and success screen worked. A subsequent read-only auth check confirmed a new account created at 2026-09-12 08:26:05 UTC and a confirmation-send timestamp at 08:26:06 UTC. The email is still unconfirmed, with no login recorded. This establishes account creation and the send event, not inbox delivery. Hermes' command scanner rejected its mailbox check because it piped output into Python; the simpler local check also found the mailbox CLI unavailable. The user has been asked to open the confirmation email. Tailor login/dashboard remains pending that step. No fake business was created or claimed. Sarah's existing account remains intact.

Evidence directory: `/Users/admin/GroomingBook Directory/output/signup-data-repair-2026-09-12/`. Key files: `public-checks.json`, `real-owner-checks.json`, `final-data-verification.json`, `data-repairs.json`, `publication.json`, `hermes-tailor/report.md`, and `hermes-tailor/account-verification.json`. Credentials and private backups are excluded from this report and deployment.

## Completed Tailor email and login test

The user confirmed receipt and clicked the verification link. Read-only auth verification records email confirmation at 2026-09-12 08:33:07 UTC. Hermes then completed normal password login, reached the correct empty dashboard, refreshed with the session retained, inspected claim lookup and the new-listing form, logged out, and logged back in successfully. Sarah's claim route correctly reported the listing already claimed. Desktop 1440px and mobile 390px paths were usable with no mobile overflow. No fake listing, ownership change, or submitted new-listing request was made. This supersedes the pending Tailor email/login result above. Evidence: `hermes-tailor/report-continued.md`, `checks-continued.json`, `account-after-confirmation.json`, and screenshots 06–16.

## Hermes mailbox connection verified

After the user entered a Google app password through a hidden local prompt, Hermes authenticated successfully to the Tailor mailbox using Himalaya 2.1.0. Both IMAP and SMTP account checks returned success. A bounded native search found the actual “Welcome to GroomLocal! Confirm Your Email” message dated 2026-09-12 08:26:07 UTC. No message was sent, changed, or opened; no confirmation link was reused. The credential is stored in macOS Keychain, and the account configuration contains only a Keychain lookup command. The local email skill now matches v2 commands and uses native searches without interpreter pipelines. No approval settings were changed. Evidence: `hermes-email-setup/verification.json` and `hermes-email-setup/report.md` under the task output directory.
