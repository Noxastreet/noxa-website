import assert from "node:assert/strict";
import {
  collectCarsCoffeeGreece,
  collectElmotoEvents,
  parseEnglishDateRange,
  parseGreekEventDate,
  parseHellenicUpcomingHtml,
} from "../supabase/functions/radar-collector/communityAdapters.ts";

const now = new Date("2026-09-01T08:00:00Z");
const source = (name, url) => ({ id: `id-${name}`, name, url, country_code: "GR", trust_level: "trusted" });

const hellenicCurrent = `
<section><h2>Upcoming Events</h2>
<p>Upcoming Event</p><h1>Summer Style Car Meet</h1><p>26 June</p>
<p>Upcoming Event</p><h1>Spa Franchorchamps Getaway w/ Porsche GT Cars!</h1><p>2 October</p>
<h2>Archive</h2></section>`;
assert.equal(parseHellenicUpcomingHtml(hellenicCurrent, source("Hellenic Spot", "https://hellenicspot.gr/"), now).length, 0);

const hellenicFuture = `<h2>Upcoming Events</h2><p>Upcoming Event</p><h3>Athens Night Car Meet</h3><p>12 October</p><h2>Archive</h2>`;
const hFuture = parseHellenicUpcomingHtml(hellenicFuture, source("Hellenic Spot", "https://hellenicspot.gr/"), now);
assert.equal(hFuture.length, 1);
assert.equal(hFuture[0].event_type, "car_meet");
assert.equal(hFuture[0].starts_at, "2026-10-12T06:00:00.000Z");
assert.match(hFuture[0].original_url, /noxa_event=/);

assert.equal(parseGreekEventDate("28 Μαΐου – 1 Ιουνίου 2026", now), null);
const greekFuture = parseGreekEventDate("28 Μαΐου – 1 Ιουνίου 2027", now);
assert.deepEqual(greekFuture, { startsAt: "2027-05-28T06:00:00.000Z", endsAt: "2027-06-01T20:00:00.000Z" });

const documentOrderRange = parseEnglishDateRange("OCTOBER 18, 2026 – OCTOBER 19, 2026", now);
assert.deepEqual(documentOrderRange, { startsAt: "2026-10-18T06:00:00.000Z", endsAt: "2026-10-19T20:00:00.000Z" });

let noUpcomingDiscoveryUrl = "";
const carsNoUpcomingFetch = async (input) => {
  noUpcomingDiscoveryUrl = String(input);
  return new Response(`<html><h1>Find Events</h1><p>No upcoming events in Greece.</p></html>`, { status: 200 });
};
assert.deepEqual(await collectCarsCoffeeGreece(source("Cars & Coffee Greece", "https://cars.coffee/find-events"), carsNoUpcomingFetch, now), []);
assert.match(noUpcomingDiscoveryUrl, /\/en\/find-events\?/);
assert.match(noUpcomingDiscoveryUrl, /country=66/);
assert.match(noUpcomingDiscoveryUrl, /when=Upcoming/);

const carsFutureFetch = async (input) => {
  const url = String(input);
  if (url.includes("/en/find-events?") && url.includes("country=66") && url.includes("when=Upcoming")) {
    return new Response(`<a href="/en/find-events/cars-coffee-athens-2026">Athens</a>`, { status: 200 });
  }
  return new Response(`<footer>Historic launch APRIL 13, 2014</footer><h1>Cars & Coffee Greece | Athens</h1><table><tr><td>Date</td><td>OCTOBER 18, 2026</td></tr><tr><td>Where</td><td>Athens</td></tr><tr><td>Organized by</td><td>C&C Greece</td></tr></table>`, { status: 200 });
};
const carsFuture = await collectCarsCoffeeGreece(source("Cars & Coffee Greece", "https://cars.coffee/find-events"), carsFutureFetch, now);
assert.equal(carsFuture.length, 1);
assert.equal(carsFuture[0].event_type, "cars_and_coffee");
assert.equal(carsFuture[0].starts_at, "2026-10-18T06:00:00.000Z");
assert.equal(carsFuture[0].location_text, "Athens");

const elmotoCurrentFetch = async (input) => {
  const url = String(input);
  if (url.includes("/category/events/")) return new Response(`<h3><a href="https://elmoto.gr/summer-meet/">3η Καλοκαιρινή Συνάντηση Μοτοσυκλετιστών</a></h3>`, { status: 200 });
  return new Response(`<h1>3η Καλοκαιρινή Συνάντηση Μοτοσυκλετιστών</h1><p>ΕΛ.ΜΟΤ.Ο. – Ροβιές Ευβοίας</p><p>28 Μαΐου – 1 Ιουνίου 2026</p>`, { status: 200 });
};
assert.deepEqual(await collectElmotoEvents(source("ΕΛΜΟΤΟ", "https://elmoto.gr/category/events/"), elmotoCurrentFetch, now), []);

const elmotoFutureFetch = async (input) => {
  const url = String(input);
  if (url.includes("/category/events/")) return new Response(`<h3><a href="https://elmoto.gr/winter-meet-2026/">4η Χειμερινή Συνάντηση Μοτοσυκλετιστών</a></h3><h3><a href="https://elmoto.gr/general-assembly/">5η Γενική Συνέλευση ΕΛΜΟΤΟ</a></h3>`, { status: 200 });
  if (url.includes("general-assembly")) return new Response(`<h1>5η Γενική Συνέλευση ΕΛΜΟΤΟ</h1><p>10 Οκτωβρίου 2026</p>`, { status: 200 });
  return new Response(`<h1>4η Χειμερινή Συνάντηση Μοτοσυκλετιστών</h1><p>Καλαμπάκα</p><p>27 – 29 Νοεμβρίου 2026</p>`, { status: 200 });
};
const elmotoFuture = await collectElmotoEvents(source("ΕΛΜΟΤΟ", "https://elmoto.gr/category/events/"), elmotoFutureFetch, now);
assert.equal(elmotoFuture.length, 1);
assert.equal(elmotoFuture[0].event_type, "moto_meet");
assert.equal(elmotoFuture[0].starts_at, "2026-11-27T06:00:00.000Z");
assert.equal(elmotoFuture[0].ends_at, "2026-11-29T20:00:00.000Z");

console.log("community adapter fixtures: PASS");
