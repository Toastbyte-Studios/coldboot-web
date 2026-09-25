-- Migration number: 0001
--
-- Waitlist signups. Stores only what's needed to send the launch email:
-- the address, when it was added, and which form it came from. No IP
-- address, user agent or other tracking data.
CREATE TABLE waitlist (
  email TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
