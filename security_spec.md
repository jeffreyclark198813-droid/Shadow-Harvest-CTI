# Security Specification: Shadow Harvest CTI

## Data Invariants
1. **User Identity Isolation**: A user's personas and settings must only be accessible (read/write) by that user.
2. **Target Ownership**: Only the creator of a target can modify or delete it.
3. **Audit Integrity**: Audit logs are append-only by the system; users cannot modify or delete them.
4. **Quarantine Isolation**: Rejected artifacts can only be read/managed by admins or the system.
5. **Entity Validation**: All documents must adhere to the schema defined in `firebase-blueprint.json`.

## The "Dirty Dozen" Payloads (Red Team Test Cases)
1. **Identity Spoofing**: Attempt to create a `UserPersona` for another `userId`.
2. **Privilege Escalation**: Attempt to set `role: "admin"` on a `User` document.
3. **Cross-User Access**: Attempt to read another user's `UserSettings`.
4. **Orphaned Target**: Attempt to create a `Target` without a valid `createdBy` matching current user.
5. **Unauthorized Modification**: Attempt to update another user's `Target` document.
6. **Shadow Field Injection**: Attempt to inject a `ghost_field` into a `User` document.
7. **Audit Tampering**: Attempt to delete an `AuditLog` entry.
8. **Quarantine Bypass**: Attempt to read `QuarantineEntry` as a regular user.
9. **Large Payload Attack**: Attempt to write a 1MB string into a `Target` name field.
10. **State Skipping**: Attempt to move an `AuditLog` result from `failure` to `success` post-creation.
11. **Regex Poisoning**: Attempt to use an invalid document ID (e.g., `../dangerous/path`).
12. **Timestamp Spoofing**: Attempt to set a manual `timestamp` instead of `serverTimestamp()`.

## Test Runner (Schema & Permission Verification)
A complete `firestore.rules.test.ts` would verify these payloads return `PERMISSION_DENIED`.
