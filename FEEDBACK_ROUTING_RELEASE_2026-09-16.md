# Replyable feedback routing — September 16, 2026

The primary Give feedback action on catalog cards, project drawers and public recipient pages now opens the existing guided feedback page in a modal. Its submission uses `creator_feedback`, which feeds the existing Messages conversation, notification and review qualification workflow. Owner and existing-conversation states reuse the same page and remain visible without a submission form.

Public comments remain a secondary, explicitly labeled Leave a public comment option. Existing token-gated guest posting is preserved. Copy explains public moderation, guest attribution and the existing one-comment-per-app update behavior. Ordinary comments do not count toward the earned badge.

Completing guided feedback prompts guests to join before submission. Choices, text, browsing filters and project/profile context survive joining; restoring the draft does not automatically post it. The catalog now loads the shared handlers needed for guided feedback and native profile/project Save controls. Existing return prompt timings and quote locations remain unchanged. Long return prompts continue to use the guided review pathway.

No database migration, feedback schema merge, new verification system, company restriction or payment requirement is included. Codexnest was not published and no real invitations were sent. Invite-only links still lead directly to the external app; a public listing is required to exercise the existing TryMyBuild recipient journey.

## Validation

- 226 automated tests pass, including guided submission routing, authentication, draft/context restoration, modal failure handling and duplicate opening prevention.
- Type checks and production build pass.
- Desktop and narrow mobile guest previews checked: primary feedback, completed form joining, declining signup with draft retained, public comment error recovery, creator profile Save and nested project/feedback drawers.
- No accounts, comments, reviews or saves were created in production during this work.

The real-phone text invitation, moderation, owner notification and reply delivery smoke test remains outstanding. WorkOS production configuration, public indexing, badge availability in the current Studio-only catalog and a future decision about the two feedback models remain broader launch work.
