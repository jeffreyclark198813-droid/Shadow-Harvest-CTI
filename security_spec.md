# Security Specification - Shadow Harvest CTI

## 1. Data Invariants
- A `UserPersona` must belong to the user who created it (`userId == auth.uid`).
- `UserSettings` (main) can only be read and written by the owner.
- `Targets` must have a `createdBy` field matching the `auth.uid` of the creator.
- Access to target subcollections (reports, assessments, etc.) is restricted to the owner of the parent target.
- `ApiEndpoints` are private to the creator.
- `IntelCaches` are public for reading (to share benefits of cached results) but only writable by authenticated users.

## 2. The "Dirty Dozen" Payloads

### Identity Spoofing
1. **Payload**: Create a persona with `userId: "attacker_id"` while logged in as `victim_id`.
   - **Target**: `users/victim_id/personas/new_persona`
   - **Expected**: PERMISSION_DENIED

2. **Payload**: Update another user's settings.
   - **Target**: `users/other_user/settings/main`
   - **Expected**: PERMISSION_DENIED

3. **Payload**: Create a target with `createdBy: "victim_id"` while logged in as `attacker_id`.
   - **Target**: `targets/new_target`
   - **Expected**: PERMISSION_DENIED

### Integrity & Schema
4. **Payload**: Create a persona missing the `name` field.
   - **Target**: `users/auth_uid/personas/p1`
   - **Expected**: PERMISSION_DENIED

5. **Payload**: Inject a 2MB string into a persona's `backstory`.
   - **Target**: `users/auth_uid/personas/p1`
   - **Expected**: PERMISSION_DENIED (Size limit)

6. **Payload**: Set `role: "admin"` in user settings as a regular user.
   - **Target**: `users/auth_uid/settings/main`
   - **Expected**: PERMISSION_DENIED (RBAC field protection)

### State Shortcutting
7. **Payload**: Update a target's `updatedAt` to a past timestamp instead of `request.time`.
   - **Target**: `targets/t1`
   - **Expected**: PERMISSION_DENIED

### Resource Poisoning
8. **Payload**: Use a 2000-character string as a document ID for a new target.
   - **Target**: `targets/very_long_id...`
   - **Expected**: PERMISSION_DENIED (isValidId check)

### PII Leakage
9. **Payload**: Read another user's `settings` collection.
   - **Target**: `users/other_user/settings/main`
   - **Expected**: PERMISSION_DENIED

### Orphaned Records
10. **Payload**: Create a target report referencing a non-existent `targetId`.
    - **Target**: `targets/invalid_target/reports/r1`
    - **Expected**: PERMISSION_DENIED (exists check)

### Interaction Safety
11. **Payload**: Create an anomaly record in another user's target.
    - **Target**: `targets/other_user_target/anomalies/a1`
    - **Expected**: PERMISSION_DENIED

### Denial of Wallet
12. **Payload**: Perform a list query on `api_endpoints` without a `createdBy` filter.
    - **Target**: `api_endpoints`
    - **Expected**: PERMISSION_DENIED (Secure List Queries enforcer)
