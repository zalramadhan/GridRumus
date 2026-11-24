# GridRumus Firestore Security Specification

## Data Invariants
1. A `UserProfile` at `/users/{userId}` can only be read, created, or updated by the verified owner (`request.auth.uid == userId && request.auth.token.email_verified == true`), and `list` queries on `/users` are strictly denied to prevent PII enumeration.
2. A `PracticeProgress` document at `/users/{userId}/progress/practice` cannot exist without its parent `/users/{userId}` profile document (`exists(...)`), and `userId` is immutable after creation.
3. All `createdAt` and `updatedAt` timestamps must equal `request.time`.
4. All writes enforce strict `hasAll` / `hasOnly` and `affectedKeys().hasOnly(...)` key allowlists, plus explicit `.size()` bounds on all strings, maps, and arrays.

## Dirty Dozen Adversarial Payloads (Must Return PERMISSION_DENIED)
1. Unauthenticated read or write on `/users/{userId}`.
2. Cross-user read (`get`) on `/users/{otherUid}` to scrape email PII.
3. Collection `list` query on `/users` by any signed-in user.
4. Creating `/users/{userId}` with unverified email (`email_verified: false`).
5. Identity spoofing: creating `/users/{uidA}` with `uid: uidB`.
6. Shadow field injection: creating `/users/{userId}` with extra `isAdmin: true` or `role: "admin"` field.
7. Client timestamp tampering: creating `/users/{userId}` with client-supplied `createdAt` not equal to `request.time`.
8. Mutating immutable `uid` or `createdAt` during `UserProfile` update.
9. Creating `/users/{userId}/progress/practice` when parent `/users/{userId}` does not exist.
10. Creating `/users/{userId}/progress/arbitraryId` where `progressId != "practice"`.
11. Oversized array DoW payload (`solvedQuestionIds` > 200 items or `challengeHistory` > 10 items).
12. Cross-user `list` or `write` on `/users/{otherUid}/progress/practice`.
