# A7. Production Data Volume

Status: Initial snapshot ready
Final action: Refresh before migration/final handover

## Reviewed Snapshot

Current reviewed database size: 16 MB.

| Entity | Count |
| --- | ---: |
| Leads | 295 |
| Campaigns | 406 |
| Tickets | 42 |
| Twilio messages | 56 |
| Twilio calls | 166 |
| WhatsApp messages | 1 |

## Supporting Counts Reviewed

| Entity | Count |
| --- | ---: |
| Clinics | 8 |
| Departments | 35 |
| Users | 47 |
| Employees | 6 |
| Pipelines | 31 |
| Pipeline stages | 75 |
| Stage rules | 366 |
| Social accounts | 15 |

## Data Range Reviewed

| Entity | First Date | Last Date |
| --- | --- | --- |
| Leads | 15-Jan-2026 | 16-Jun-2026 |
| Campaigns | 01-Mar-2026 | 12-Jun-2026 |
| Tickets | 10-Mar-2026 | 14-May-2026 |
| Twilio messages | 22-Mar-2026 | 16-Jun-2026 |
| Twilio calls | 26-Mar-2026 | 16-Jun-2026 |
| WhatsApp messages | 13-May-2026 | 13-May-2026 |

## Migration Note

A final read-only database snapshot should be taken immediately before migration or client handover. Test/demo records should be confirmed before cleanup because some records may be used for QA or integration validation.

