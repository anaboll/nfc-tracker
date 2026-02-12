# Task log

P0 (must fix)
- [ ] B1: Require clientId for tag/action creation (UI + API validation)
- [ ] B2: Move-to-campaign must enforce clientId consistency
- [ ] B3: Fix counters mismatch (All clients vs scans)

P0.5 (saves server space)
- [ ] V1: Video lifecycle - delete action removes file from disk (if safe)
- [ ] V2: Video replace removes old file after successful update (if safe)
- [ ] V3: Safety: do not delete shared files + prevent path traversal

P1 (cheap + high value)
- [ ] F1: QR action type (generate QR + download button)
- [ ] F2: Track source via /s (nfc) vs /q (qr)
- [ ] UX1: Better create-flow + empty states
