import assert from "node:assert/strict";

import { buildGoogleCalendarUrl, buildIcsCalendar } from "../src/lib/meets/calendar.ts";
import { buildDiscoveryQuery, matchesDateFilter, matchesDiscoveryEvent } from "../src/lib/meets/dateFilters.ts";
import { isEventCurrentlyVisible, isEventHappeningNow, isPastEvent } from "../src/lib/meets/eventVisibility.ts";
import { readSavedEvents, toggleSavedEvent } from "../src/lib/meets/savedEvents.ts";

const now = new Date("2026-09-05T14:35:00.000Z");
assert.equal(matchesDateFilter("2026-09-05T16:00:00.000Z", "today", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-06T08:00:00.000Z", "tomorrow", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-04T18:00:00.000Z", "weekend", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-06T18:00:00.000Z", "weekend", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-07T18:00:00.000Z", "weekend", "Europe/Athens", now), false);

assert.equal(isEventHappeningNow("2026-09-05T13:00:00.000Z", "2026-09-05T15:00:00.000Z", now.getTime()), true);
assert.equal(isEventCurrentlyVisible("2026-09-05T13:00:00.000Z", "2026-09-05T14:35:00.000Z", now.getTime()), true);
assert.equal(isPastEvent("2026-09-05T10:00:00.000Z", "2026-09-05T14:34:59.000Z", now.getTime()), true);
assert.equal(isPastEvent("2026-09-05T10:00:00.000Z", null, new Date("2026-09-05T13:00:01.000Z").getTime()), true);

const query = buildDiscoveryQuery({ country: "GR", city: "Thessaloniki", type: "car", date: "weekend", q: "night meet" });
const params = new URLSearchParams(query);
assert.equal(params.get("country"), "GR");
assert.equal(params.get("city"), "Thessaloniki");
assert.equal(params.get("type"), "car");
assert.equal(params.get("date"), "weekend");
assert.equal(params.get("q"), "night meet");

const combinedState = { country: "GR", city: "Thessaloniki", type: "car", date: "weekend", q: "night" };
const combinedEvent = { title: "NOXA Night Meet", organizer: "North Crew", city: "Thessaloniki", eventType: "car_meet", startsAt: "2026-09-05T18:00:00.000Z", timezone: "Europe/Athens" };
assert.equal(matchesDiscoveryEvent(combinedEvent, combinedState, "en", now), true);
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, city: "Athens" }, combinedState, "en", now), false);
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, eventType: "moto_meet" }, combinedState, "en", now), false);

const memory = new Map();
const storage = { getItem: (key) => memory.has(key) ? memory.get(key) : null, setItem: (key, value) => memory.set(key, value) };
assert.equal(toggleSavedEvent(storage, "event-a"), true);
assert.deepEqual(readSavedEvents(storage), ["event-a"]);
assert.equal(toggleSavedEvent(storage, "event-a"), false);
assert.deepEqual(readSavedEvents(storage), []);

const calendarEvent = { id: "11111111-1111-4111-8111-111111111111", title: "NOXA, Night; Meet", startsAt: "2026-09-12T18:00:00.000Z", endsAt: null, location: "Thessaloniki, Greece" };
const ics = buildIcsCalendar(calendarEvent, "https://noxastreetapp.com/meets/night", now);
assert.match(ics, /DTSTART:20260912T180000Z/);
assert.match(ics, /DTEND:20260912T210000Z/);
assert.match(ics, /SUMMARY:NOXA\\, Night\\; Meet/);
assert.match(ics, /LOCATION:Thessaloniki\\, Greece/);
const google = new URL(buildGoogleCalendarUrl(calendarEvent, "https://noxastreetapp.com/meets/night"));
assert.equal(google.hostname, "calendar.google.com");
assert.equal(google.searchParams.get("dates"), "20260912T180000Z/20260912T210000Z");

console.log("meets growth fixtures: PASS");
