# Exam integrity and writing review rollout

## What changes

- Creator user list has a full Edit Account action (name, surname, email, branch, profile, password).
- New IELTS/TOEFL/Placement/General English/Kids attempts may require preflight and explicit acceptance. SAT and Math remain exempt.
- Existing attempts have no `exam_integrity` row and are never enrolled retroactively. Creation captures the policy; later environment changes do not remove it.
- Start time is set at first acceptance, never reset on resume. Existing exam resume timers remain unchanged.
- An observed fullscreen exit during an active attempt invalidates it. Saved answers are retained. Backend guards and PostgreSQL triggers reject subsequent writes/results.
- Hidden tab, navigation, offline, paste length and periodic writing-length observations are separate events, not automatic cheating verdicts. No global clipboard contents or OS keystrokes are collected.
- Staff see an audit panel on attempt results, can inspect saved answers and add a technical-incident review note. Notes do not resurrect a disqualified attempt; a new attempt must be arranged separately.
- Writing AI checker is a teacher-invoked AI-assisted review, NOT a validated AI-authorship detector. It never supplies an AI percentage, changes marks or automatically penalizes a student. The existing OpenAI service receives essay text and aggregate event counts, not account names/emails. No additional provider is configured.

## Deploy safely

This change includes a database migration. Do NOT deploy only the frontend files.

1. Back up the production database through the existing backup procedure. Inspect `npx prisma migrate status`; investigate unrelated pending/failed migrations first.
2. Deploy all changed and new source files, including `prisma/migrations/20261002120000_exam_integrity/migration.sql`.
3. Keep `EXAM_LOCKDOWN_ENABLED=false` initially. Run `npx prisma migrate deploy`, then `npm run build` in the normal release/build environment. Use a separate release directory if students are actively using the current build.
4. Restart the application using the existing production procedure. For this project's PM2 process: `pm2 restart examsJeff --update-env`. Ensure the intended environment is actually loaded; never print API keys in logs.
5. Run the manual tests below on staging first. Enable `EXAM_LOCKDOWN_ENABLED=true` in the actual server environment and restart with updated environment only after checks pass.
6. Existing attempts remain exempt; only subsequently created eligible attempts receive a policy. Turning the flag off stops enrollment of new attempts but does not remove protection from already-protected attempts.

Schema/client validation does not execute this migration. It has NOT been applied to production by this task.

## Automated checks

```
node node_modules/jest/bin/jest.js --config jest.integrity.config.cjs --runInBand
node node_modules/jest/bin/jest.js --config jest.creator.config.cjs --runInBand
node node_modules/jest/bin/jest.js --config jest.speaking.config.cjs --runInBand
```

These use mocked database/OpenAI/browser APIs. They do not substitute for actual PostgreSQL migration, concurrency and cross-browser tests.

Validated locally: 42 integrity/originality/UI tests, 10 Creator tests, and 41 Speaking regression tests (93 total); Prisma schema validation and client generation passed. `npm run build` completed with the database URL deliberately overridden to an unreachable local test address, so no production DB initialization could occur. New files have no TypeScript diagnostics; the whole repository still has pre-existing diagnostics. No live OpenAI call or production migration was run.

## Required staging / real-device checks

- Windows Chrome/Edge and macOS Safari/Chrome: preflight requestFullscreen works without F11; deny fullscreen and microphone permission; unsupported browsers remain at preflight without starting.
- Play the sound test and confirm it is audible. Record and play back the three-second microphone sample, then confirm that your voice is audible. This local-only sample is not uploaded; speech quality is not automatically assessed.
- During preflight exit fullscreen: no violation and no exam countdown. Start: questions and timer appear only after acceptance.
- During active exam exit fullscreen: attempt becomes DISQUALIFIED; refresh cannot restore it. Saved recordings/answers remain inspectable by staff.
- Concurrent submit and exit: verify database row-lock/trigger behavior. Late exit after successful submit must be ignored. Repeated event delivery is idempotent.
- Refresh, tab hide, page close, BFCache return, offline/reconnect: log separately, do not label these events as proven cheating. Resume requires fullscreen; timer must not reset. Offline fullscreen-exit event must be retried before resuming.
- Speaking microphone permission is acquired before exam start. Verify recording recovery, Next, section navigation, listening playback and normal submission with the security gate active.
- Existing in-progress attempt + new SAT/Math attempt: no preflight policy.
- Teacher in another branch and unrelated student cannot access security evidence or invoke writing review. Parent can see their child's invalid status but not internal staff notes.
- AI provider failure/refusal: display Failed, preserve answer/grade, allow retry. Changed essay invalidates cached review. Concurrent review requests do not duplicate work.
- Creator: edit name/email/profile, save, reload list and re-open editor; verify persistence.

## Limitations

This is browser fullscreen enforcement, not an OS lockdown browser. Client events are not tamper-proof. A second device and all OS-level activity cannot be detected. Navigation/refresh and abrupt process termination are not reliably distinguishable from every browser fullscreen transition; test the listed browsers before imposing penalties. Technical incidents require staff review. AI text analysis cannot reliably establish authorship.

Full-project TypeScript validation has existing unrelated errors; do not treat passing targeted tests or the compiled build as a clean type check. Validate the actual deployed release and migration before activation.

The current Next.js configuration has `typescript.ignoreBuildErrors=true`; even a successful build is not a clean TypeScript check. Existing startup code also automatically provisions a privileged Creator account with hard-coded initial credentials. Audit/disable that provisioning in a separate security change before relying on this as a hardened deployment; this task has not modified it.
