# A9. External Credentials List

Status: Credential categories identified
Target: 24-Jun-2026

No secrets should be committed to code or shared in documents. Actual values must be exchanged through a secure channel only.

| Category | Used For | Stored / Configured In | Required From Client / Ops |
| --- | --- | --- | --- |
| Facebook / Instagram | Meta campaign creation, Ads Manager sync, status, insights | Backend social account records and Meta developer/app configuration | Business Manager access, ad account, page, Instagram account, app permissions, valid tokens |
| LinkedIn Ads | LinkedIn campaign creation/status/insights | Backend social account records and LinkedIn developer/account setup | LinkedIn ad account, organization URN, campaign group, billing-ready account |
| Google / Google Ads | Google Ads campaigns and insights | Backend Google Ads credentials/customer ids | Customer id, developer token/OAuth setup, account access |
| Google Business Profile | Google review integration | Backend OAuth/integration setup | GBP account/location access |
| Zapier | Campaign bridge and appointment/calendar workflows | Zapier workspace Zaps/webhook URLs | Workspace access, Zap ownership, webhook URLs/history |
| Twilio / WhatsApp | Calls, SMS, inbound messages, WhatsApp integration | Backend environment/provider setup | Twilio account, phone numbers, WhatsApp sender, approved templates |
| SMTP / Email | Outbound appointment/template emails | Backend email environment | SMTP host/user/password/from address or Gmail OAuth setup |
| Google Calendar / Meet | Calendar event and Meet link | Zapier/Google OAuth or backend integration | Calendar account, OAuth consent/access, timezone confirmation |
| Deployment Environment | FE/BE deploy configuration | Server env files, CI/CD secrets, branch-specific deploy scripts | Domain, API base URL, allowed hosts, CORS, secret key, DB credentials |
| Client Login Proxy | External/client login access | Deployment env/proxy config | Whitelisted server IP, proxy username/password through secure channel |

## Security Notes

Tokens and account credentials must not be placed in client-facing documents. Frontend environment values are visible in browser bundles, so sensitive service credentials should be moved to backend-owned APIs wherever possible.

