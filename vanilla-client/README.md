# Vanilla Client

This folder contains a client-side only version of the live score frontend wired to the backend at:

- `https://bom.ultrasploit.com`

## Run

Use any static file server and open `index.html`.

```bash
npx serve vanilla-client
```

## API base URL

Use the `API Base URL` field in the navbar. It is saved in `localStorage` as `bom_api_base_url`.

Default:

```text
https://bom.ultrasploit.com
```

## Backend contract used

Public read endpoints:

- `POST /match` -> returns all matches
- `POST /match/{id}` -> returns one match
- `POST /players` -> returns all players
- `POST /players/{team}` -> returns players by team
- `GET /updates` -> SSE stream with update objects like `snapshot`, `ball`, etc.

Admin write endpoint:

- `POST /admin/broadcast`

Payload format:

- `{"type":"toss"}`
- `{"type":"start","data":{"match_id":"BOM_TST_2026","opening_team":"ananda_college"}}`
- `{"type":"pause","data":{"reason":"Rain"}}`
- `{"type":"end"}`
- `{"type":"ball","data":{"ball_type":"runs","striker_id":"acp_01","non_striker_id":"acp_02","bowler_id":"ncp_02","runs_scored":1,"wicket":false,"wicket_fielder_id":null}}`

## Pages

- `index.html` live match board
- `summary.html` team/player listing from API
- `credits.html` credits
- `admin-login.html` session gate
- `admin-dashboard.html` broadcast control panel
