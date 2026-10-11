-- Claims are now approved automatically unless they look clearly unrelated to the
-- business (src/lib/claims.ts). Approvals that are not a website-domain match are
-- recorded as 'auto_approved'; the specific rule is kept in reviewed_by ("system:<rule>").

alter table public.claim_requests drop constraint if exists claim_requests_verification_check;
alter table public.claim_requests
  add constraint claim_requests_verification_check
  check (verification in ('domain_match', 'auto_approved', 'admin_review'));
