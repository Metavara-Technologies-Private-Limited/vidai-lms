# A10. Test Cases / Test Data / Seed Scripts

Status: QA tracker consolidated; seed data pending final scope freeze
Target: 25-Jun-2026

## Regression Test Areas

| Module | Test Coverage Needed |
| --- | --- |
| Login / Permissions | Login, auto-login, profile restore, clinic switch, page-wise permissions after re-login |
| Leads Hub | Add/edit/view/delete/archive lead, bulk import, dynamic lead form fields, required fields, assigned user, location, source, product interest |
| Lead Detail | Notes, history, call/SMS/email tabs, next action, mark done, appointment booking, meeting email/calendar payload |
| Pipeline Configuration | Pipeline create/edit/delete, stage rules, stage move, data capture fields, mandatory stage fields |
| Campaigns | Campaign create/edit/duplicate/stop, scheduled campaign edit, Meta image upload, Meta/Google/LinkedIn status and insights |
| Reputation Management | Review request creation, permissions, templates, review form link flow, Google review integration once enabled |
| Tickets / Communication | Ticket create/reply/filter, inbound email reply capture, timeline display |
| Header | Notification bell, calendar dropdown, clinic/lab context |
| Integrations | Zapier, Twilio, WhatsApp, SMTP, Google Calendar/Meet, Meta, LinkedIn, Google Ads |

## Seed/Test Data Needed

| Data Area | Minimum Data |
| --- | --- |
| Clinics/Labs | At least one clinic with departments, employees, doctors/personnel |
| Users/Roles | Super admin, admin, regular user, restricted permission user |
| Pipelines | One default pipeline with lead/follow-up/appointment/registered stages and stage rules |
| Lead Form Fields | Mandatory base fields plus configurable fields for stage data capture |
| Leads | Leads across all stages, with and without appointments, assigned users, email/phone/address/product interest |
| Campaigns | Draft, scheduled, live/active, paused, completed/failed examples across Meta, Google Ads, LinkedIn, email |
| Communication | Sample calls, SMS, inbound replies, email replies, tickets |

## Seed Script Note

Seed scripts should be prepared only after final cleanup decisions are made for demo/test production records. Until then, QA should use controlled test clinics and clearly tagged test records.

