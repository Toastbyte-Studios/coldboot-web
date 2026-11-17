/**
 * Waitlist signups by form, straight from the D1 database.
 *
 *   npm run report:waitlist            production (needs `wrangler login`)
 *   npm run report:waitlist -- --local the local database under .wrangler/
 *
 * Why this exists: Google Analytics only hears from visitors who accepted
 * the consent banner, so its signup counts are a floor, not the number. The
 * `source` column records which form every signup came from regardless of
 * consent, so this is the figure to trust for "how many, and from where".
 * Use GA4 for rates among consenting visitors (waitlist_form_viewed ->
 * waitlist_signup_started -> waitlist_signup_succeeded), and this for totals.
 *
 * It prints counts only. No address is read into the output.
 */
import { execFileSync } from 'node:child_process';

const DATABASE = 'coldboot-waitlist';
const target = process.argv.includes('--local') ? '--local' : '--remote';

/** `created_at` is ISO 8601 UTC text, so string comparison orders it. */
const since = (days) =>
  `strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-${days} days')`;

const BY_SOURCE = `
  SELECT source,
         COUNT(*) AS total,
         SUM(created_at >= ${since(7)}) AS last_7_days,
         SUM(created_at >= ${since(30)}) AS last_30_days,
         substr(MIN(created_at), 1, 10) AS first_signup,
         substr(MAX(created_at), 1, 10) AS latest_signup
  FROM waitlist
  GROUP BY source
  ORDER BY total DESC`;

const BY_WEEK = `
  SELECT strftime('%Y-W%W', created_at) AS week,
         COUNT(*) AS signups
  FROM waitlist
  WHERE created_at >= ${since(84)}
  GROUP BY week
  ORDER BY week`;

function query(sql) {
  const output = execFileSync(
    'npx',
    [
      'wrangler',
      'd1',
      'execute',
      DATABASE,
      target,
      '--json',
      '--command',
      sql.replace(/\s+/g, ' ').trim(),
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  // Wrangler prints one result object per statement.
  const [result] = JSON.parse(output);
  return result?.results ?? [];
}

const bySource = query(BY_SOURCE);
const total = bySource.reduce((sum, row) => sum + row.total, 0);

console.log(`\nWaitlist signups by form (${target.slice(2)}): ${total} total`);
if (bySource.length === 0) {
  console.log('No signups yet.');
} else {
  console.table(
    bySource.map((row) => ({
      ...row,
      share: `${Math.round((row.total / total) * 100)}%`,
    })),
  );
  console.log('Signups per week, last 12 weeks (UTC):');
  console.table(query(BY_WEEK));
}
