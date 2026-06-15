# TODO — telemt Control API coverage

telemt's Control API has way more endpoints than this UI uses. Tracking
what's wired up vs. what's not, so it's clear what could be added if needed.

## Implemented

| Method | Path |
| --- | --- |
| `GET` | `/v1/users` |
| `POST` | `/v1/users` |
| `POST` | `/v1/users/{username}/enable` |
| `POST` | `/v1/users/{username}/disable` |
| `POST` | `/v1/users/{username}/rotate-secret` |
| `POST` | `/v1/users/{username}/reset-quota` |
| `PATCH` | `/v1/users/{username}` |
| `DELETE` | `/v1/users/{username}` |
| `GET` | `/v1/health` |
| `GET` | `/v1/health/ready` |
| `GET` | `/v1/system/info` |

## Not implemented

User management:
| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/v1/users/{username}` | single-user detail; list page covers this for now |

Everything else (not user-management, probably out of scope for this UI):
| Method | Path |
| --- | --- |
| `GET` | `/v1/config`, `PATCH /v1/config` |
| `GET` | `/v1/limits/effective` |
| `GET` | `/v1/security/posture`, `/v1/security/whitelist` |
| `GET` | `/v1/stats/summary`, `/v1/stats/zero/all`, `/v1/stats/upstreams`, `/v1/stats/minimal/all`, `/v1/stats/me-writers`, `/v1/stats/dcs` |
| `GET` | `/v1/runtime/*` (gates, initialization, me_pool_state, me_quality, upstream_quality, nat_stun, me-selftest, connections/summary, events/recent, tls-fingerprints) |
