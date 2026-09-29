# TryMyBuild system notification standard

Approved direction: email only for account setup, security, and consequential outcomes in a workflow the user started. Routine community activity stays in-app. Email delivery through Zoho is pending account enablement and integration.

## Email the affected user

- Email verification and requested password recovery: retain WorkOS delivery; do not send a duplicate application email.
- Account email/password/security changes: send the relevant security confirmation where supported; never include passwords, codes unrelated to the action, or private session details.
- Account setup or app ownership verification: send a request for missing information, an approval, or a decision requiring a next step. Do not email badge-progress milestones or promotional review prompts.
- Project review: send publication approval (already implemented), or a return-to-draft decision requiring corrections. Only explicitly creator-facing guidance belongs in an email; administrator-only review reasons must never be copied into it.
- Account restrictions and restoration: send the affected user a clear status and an appropriate support/appeal link, without disclosing internal moderation evidence.
- User-requested account export or deletion: send receipt/completion or a blocking problem where appropriate. Do not retain an address beyond the deletion workflow merely to send later email.
- Support: email when the user must supply information or an action is required to resolve a setup/access problem. Routine conversation replies stay in-app.

## Keep in-app only

Comments, feedback, replies, direct messages, saves, follows, activity counts, saved-project releases, discovery suggestions, review opportunities, badge-progress milestones, unfinished-draft nudges, and activity digests. Do not turn these into email automatically, even if an in-app preference is enabled.

## Delivery rules

1. Use explicit event types, not an automatic bridge from the notifications table. Existing kinds such as `verification` include routine progress nudges and are not sufficient to authorize email.
2. Address only the affected account. Founder review alerts remain a separate administrator channel.
3. One concise email per meaningful state change: what happened, whether action is required, and one primary link. No marketing additions.
4. Use a stable event/recipient identity for duplicate suppression. Delivery retries must not replay the business action or create extra notifications.
5. Keep essential notices independent of optional activity preferences. Preserve the in-app record when applicable; WorkOS authentication messages remain provider-managed.
6. Provider acceptance is not proof of inbox delivery. Surface delivery failure to administrators; add durable retry tracking before claiming guaranteed delivery.
7. No retroactive bulk emails for old notifications or previously approved projects without separate authorization.
8. Do not promise that verification guarantees a bot-free or 100% human community.

## Current implementation and remaining work

- WorkOS handles authentication verification/recovery messages.
- Creator publication approval email is implemented using Resend but production email credentials are absent; application delivery is not active.
- Founder new-project review email is implemented, with the same missing delivery configuration.
- Zoho transactional-email activation is blocked by Zoho's domain antispam validation; the owner has contacted support. Adapt both application email senders to Zoho after activation.
- The additional event categories above are the standard for subsequent implementation; they are not all wired to email yet. Verify event ownership, public-safe copy, durable delivery identity, and tests as each is connected.
