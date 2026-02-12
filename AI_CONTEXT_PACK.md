# TwojeNFC - Context Pack (short)

Stack: Next.js (App Router) + TypeScript + Prisma + Postgres. Dockerized.

Repo root: nfc-tracker/
Uploads: public/uploads (video files appear to be stored here)

Routes present:
- src/app/s/[tagId] (short link)
- src/app/link/[tagId]
- src/app/vcard/[tagId]
- src/app/watch/[tagId]
API present:
- src/app/api/clients
- src/app/api/campaigns
- src/app/api/tags
- src/app/api/scans
- src/app/api/stats
- src/app/api/upload
- src/app/api/video
- src/app/api/video-event
- src/app/api/manage/...

Known P0 bugs:
- Can create tag/action without client/campaign -> disappears / inconsistent.
- Moving tag/action to campaign can leave missing client association.
- Counters mismatch: some views show 0 scans while scans exist.
- Video lifecycle bug: deleting a video action does NOT delete the file from server disk; replacing video also leaves the old file.

Goals:
- Minimize cost and maintain control.
- Output only: PLAN, FILES, FULL FILES, TEST CHECKLIST, COMMANDS.
- Never execute commands.
- Keep changes minimal (prefer 3–6 files). If missing context, ask for max 3 specific files.

Output rules:
- FULL FILE ONLY (no diff): for each changed file print:
  FILE: <path>
  <full updated content>
