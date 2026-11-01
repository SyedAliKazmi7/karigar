# SRS changes after version 1.0

The original SRS (`SRS.pdf`) described professionals as users who never log in, reached only by WhatsApp and phone. During development, the design grew in these ways:

| Area | Version 1.0 | Now |
|---|---|---|
| Professionals | No login. Admin records their offers | Optional login. Verified professionals see matching jobs and send their own offers. Admin can still record offers for WhatsApp-only professionals |
| Offers | Customer can only accept | Customer can accept or decline. Professionals can withdraw a pending offer |
| Notifications | In-app status only | Bell with live pop-ups for customers, professionals and staff |
| Privacy of jobs | Not specified | Professionals see a job summary first. Address, phone, map pin and photos appear only after their offer is accepted |
| Abuse limits | Not specified | Limits on requests, complaints, applications and offers (database triggers) |
| Photos | Optional, FR-REQ-06 | Implemented: up to 3 JPEG photos, compressed in the browser, private storage |
| Map | Optional, FR-REQ-07 | Implemented with Leaflet and OpenStreetMap |

Not built yet: phone OTP verification, CSV export, weekly charts, offer expiry, online payments.