# App activity notifications

New comments, guided feedback, quick visitor responses, and conversation replies notify the recipient in the bell and queue an email. Existing comment moderation alerts remain unchanged. Private feedback text is not copied into emails; links lead to the authenticated app inbox or conversation. Feedback alerts remain on by default and the existing preference controls both channels. Reply alerts go to the other participant, not the author.

## Activation

1. Apply `database/026_activity_email_notifications.sql` after migrations 001–025.
2. Configure `CRON_SECRET` with a strong random value. The worker requires `RESEND_API_KEY`, `WORKOS_API_KEY`, and the existing Supabase service configuration. `PROJECT_REVIEW_FROM` is the optional verified sender override.
3. Deploy. `vercel.json` schedules `/api/internal/activity-emails` every five minutes. This schedule requires a Vercel plan supporting subdaily cron jobs; otherwise an external scheduler must call the endpoint every five minutes with `Authorization: Bearer <CRON_SECRET>`.
4. Verify with controlled test accounts: submit a comment, guided response, quick response, and reply. Confirm the correct bell recipient, email recipient, and destination. Check that an opted-out recipient receives neither new activity alert nor email.

The queue is written in the same database transaction as the notification, and is only populated for future events. Jobs are claimed with expiring leases. Provider failures retry with backoff; the notification ID is the provider idempotency key. Resend's idempotency retention bounds duplicate protection following a delivery/acknowledgement failure. Deleted accounts, unverified email addresses, and opted-out recipients are skipped. Failed jobs retain their attempt count and can be inspected in `notification_email_queue`.

Local validation: notification tests, email delivery tests, and TypeScript check. Production migration, scheduling, and real email delivery still require activation and verification.
