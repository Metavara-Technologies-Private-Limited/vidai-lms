# A6. Zapier Workflow Documentation

Status: In progress
Target: 24-Jun-2026

## Current Scope

Zapier is used as a bridge for external workflow actions that are not fully handled inside LMS UI/API.

Current flows to validate:

| Flow | LMS Trigger | Payload / Inputs | Expected Zap Result | LMS Validation |
| --- | --- | --- | --- | --- |
| Appointment email and calendar | Lead appointment booking | Event title, start time, end time, timezone, attendees, location, conferencing data, email subject/body | Email sent and Google Calendar event created with Meet link | Appointment email and calendar invite show same date/time/timezone selected in LMS |
| Google Ads campaign bridge | Campaign create/update with Google Ads selected | Campaign name, objective, content, image URL, keywords, budget, dates, time, campaign status, internal campaign id | Google Ads campaign/ad creation or update | Campaign remains linked to LMS campaign id and status/insights can sync |
| LinkedIn campaign bridge | LinkedIn campaign create/status/insights API calls | Campaign id, platform, account status, desired status | LinkedIn campaign action completes or returns account/billing error | LMS shows LinkedIn status or blocking account setup message |
| Email/ticket reply bridge | Inbound email/webhook processing | Sender, recipient, subject, body, timestamp, thread/ticket identifiers | Reply captured in LMS history/ticket timeline | Lead/ticket timeline shows inbound reply |

## How To Check Live Zaps

1. Open Zapier using the connected workspace account.
2. For each Zap, open `Trigger`, `Configure`, and `Test`.
3. Compare the latest caught webhook record with the LMS payload fields listed above.
4. Open `Zap History` and filter by the date/time of the LMS test action.
5. Confirm whether the failure is in LMS payload, Zap field mapping, provider authorization, or provider response.
6. Save a screenshot/export of each final Zap step mapping for handover.

## Access Needed

Codex cannot connect to Zapier directly without an authenticated browser session or a connector/API token. To inspect live flows, open Zapier in Chrome with the correct account and allow browser control, or share exported Zap configuration/history screenshots.

