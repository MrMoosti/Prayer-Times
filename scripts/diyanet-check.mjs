/**
 * Verifies the Diyanet credentials and the shape of what the service returns.
 *
 *   npm run diyanet:check                 # log in, list countries
 *   npm run diyanet:check -- --country 2  # list that country's provinces
 *   npm run diyanet:check -- --state 500  # list that province's districts
 *   npm run diyanet:check -- --city 17885 # fetch and parse that month
 *
 * Run it once after adding credentials. Each call spends part of the daily
 * quota, so the script never loops and never retries.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Load .env by hand: this runs outside Next, which would normally do it.
try {
  const raw = await readFile(path.join(process.cwd(), '.env'), 'utf8');
  for (const line of raw.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, '');
    process.env[match[1]] ??= value;
  }
} catch {
  console.log('No .env found — relying on the ambient environment.\n');
}

const {
  diyanetConfigured,
  listCountries,
  listStates,
  listCities,
  cityDetail,
  monthlyPrayerTimes,
  budgetReport,
} = await import('../lib/diyanet.ts');

if (!diyanetConfigured()) {
  console.error('DIYANET_EMAIL and DIYANET_PASSWORD are not set. Copy .env.example to .env.');
  process.exit(1);
}

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : Number(process.argv[i + 1]);
};

const table = (rows) =>
  rows
    .slice(0, 40)
    .map((r) => `  ${String(r.id).padStart(7)}  ${r.name}${r.code && r.code !== r.name ? ` (${r.code})` : ''}`)
    .join('\n');

try {
  const country = arg('country');
  const state = arg('state');
  const city = arg('city');

  if (city) {
    const detail = await cityDetail(city);
    console.log(`City ${detail.id}: ${detail.name}, ${detail.city}, ${detail.country}`);
    console.log(`Qibla ${detail.qiblaAngle}°, ${detail.distanceToKaaba} km to the Kaaba\n`);

    const month = await monthlyPrayerTimes(city);
    console.log(`Monthly returned ${month.length} day(s).`);
    const first = month[0];
    if (first) {
      console.log('\nFirst row as returned:');
      console.log(JSON.stringify(first, null, 2));
      console.log(
        `\nParsed: ${first.gregorianDateShort}  fajr ${first.fajr}  sunrise ${first.sunrise}  ` +
          `dhuhr ${first.dhuhr}  asr ${first.asr}  maghrib ${first.maghrib}  isha ${first.isha}`,
      );
      console.log(`UTC offset from payload: ${first.gregorianDateLongIso8601 ?? `GMT+${first.greenwichMeanTimeZone}`}`);
    }
    const dates = month.map((d) => d.gregorianDateShort);
    console.log(`\nCoverage: ${dates[0]} → ${dates[dates.length - 1]}`);
  } else if (state) {
    console.log(`Districts in state ${state}:`);
    console.log(table(await listCities(state)));
  } else if (country) {
    console.log(`Provinces in country ${country}:`);
    console.log(table(await listStates(country)));
  } else {
    console.log('Login succeeded. Countries:');
    console.log(table(await listCountries()));
    console.log('\nNext: npm run diyanet:check -- --country <id>');
  }

  const budget = await budgetReport();
  console.log(`\nQuota used on ${budget.date} (limit ${budget.limit} per endpoint):`);
  for (const [endpoint, count] of Object.entries(budget.spent)) {
    console.log(`  ${endpoint}: ${count}`);
  }
} catch (error) {
  console.error(`\nFailed: ${error.message}`);
  process.exit(1);
}
