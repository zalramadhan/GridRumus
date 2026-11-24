# GridRumus Firestore Security Specification

## Data Invariants
1. A `UserProfile` at `/users/{userId}` can only be read, created, or updated by the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`), and `list` queries on `/users` are strictly denied to prevent PII enumeration.
2. A `PracticeProgress` document at `/users/{userId}/progress/practice` cannot exist without its parent `/users/{userId}` profile document (`exists(...)`), and `userId` is immutable after creation.
3. A `PromoBannerConfig` document at `/promotions/shopee_popup` contains zero PII and is publicly readable via single-document `get` so visitors see the active Shopee Affiliate popup on load; `list` queries on `/promotions` are denied.
4. Only a verified admin (`email_verified == true` and verified admin email or `/admins/{uid}` record) may create or update `/promotions/shopee_popup`. Deletion is denied.
5. All `createdAt` and `updatedAt` timestamps must equal `request.time`.
6. All writes enforce strict `hasAll` / `hasOnly` and `affectedKeys().hasOnly(...)` key allowlists, plus explicit `.size()` bounds and URL protocol checks (`https://`).

## Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read or write on `/users/{userId}`.
2. Cross-user read (`get`) on `/users/{otherUid}` to scrape email PII.
3. Collection `list` query on `/users` or `/promotions` by any user.
4. Creating `/users/{userId}` with unverified email (`email_verified: false`).
5. Identity spoofing: creating `/users/{uidA}` with `uid: uidB`, or `/promotions/shopee_popup` with `updatedByUid != request.auth.uid`.
6. Shadow field injection: writing extra undocumented fields such as `isAdmin: true` or `role: "admin"` to `/users/{userId}` or `/promotions/shopee_popup`.
7. Client timestamp tampering: writing `createdAt` or `updatedAt` not equal to `request.time`.
8. Non-admin authenticated user attempting to create, update, or delete `/promotions/shopee_popup`.
9. Email spoofing attack: user with admin email string but `email_verified == false` attempting to update `/promotions/shopee_popup`.
10. Dangerous URI injection: admin or attacker attempting to write `affiliateUrl: "javascript:alert(1)"` or non-HTTPS URL to `/promotions/shopee_popup`.
11. Arbitrary document ID injection: writing `/promotions/other_doc` where `promoId != "shopee_popup"`, or creating `/users/{userId}/progress/arbitraryId`.
12. Privilege escalation: user attempting to write their own UID into `/admins/{userId}`.
