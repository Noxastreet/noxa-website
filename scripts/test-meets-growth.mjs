import assert from "node:assert/strict";

import { buildGoogleCalendarUrl, buildIcsCalendar } from "../src/lib/meets/calendar.ts";
import { buildDiscoveryQuery, matchesDateFilter, matchesDiscoveryEvent } from "../src/lib/meets/dateFilters.ts";
import { eventInterval, isEventCurrentlyVisible, isEventHappeningNow, isPastEvent } from "../src/lib/meets/eventVisibility.ts";
import { readSavedEvents, toggleSavedEvent } from "../src/lib/meets/savedEvents.ts";

const now = new Date("2026-09-05T14:35:00.000Z");
assert.equal(matchesDateFilter("2026-09-05T16:00:00.000Z", "today", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-06T08:00:00.000Z", "tomorrow", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-04T18:00:00.000Z", "weekend", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-06T18:00:00.000Z", "weekend", "Europe/Athens", now), true);
assert.equal(matchesDateFilter("2026-09-07T18:00:00.000Z", "weekend", "Europe/Athens", now), false);

const friday = new Date("2026-09-04T09:00:00.000Z");
assert.equal(matchesDateFilter("2026-09-04T18:00:00.000Z", "weekend", "Europe/Athens", friday), true);
assert.equal(matchesDateFilter("2026-09-06T18:00:00.000Z", "weekend", "Europe/Athens", friday), true);
assert.equal(matchesDateFilter("2026-09-11T18:00:00.000Z", "weekend", "Europe/Athens", friday), false);

const saturday = new Date("2026-09-05T09:00:00.000Z");
assert.equal(matchesDateFilter("2026-09-04T18:00:00.000Z", "weekend", "Europe/Athens", saturday), true);
assert.equal(matchesDateFilter("2026-09-06T18:00:00.000Z", "weekend", "Europe/Athens", saturday), true);

const sunday = new Date("2026-09-06T09:00:00.000Z");
assert.equal(matchesDateFilter("2026-09-04T18:00:00.000Z", "weekend", "Europe/Athens", sunday), true);
assert.equal(matchesDateFilter("2026-09-06T18:00:00.000Z", "weekend", "Europe/Athens", sunday), true);
assert.equal(matchesDateFilter("2026-09-11T18:00:00.000Z", "weekend", "Europe/Athens", sunday), false);

const monday = new Date("2026-09-07T09:00:00.000Z");
assert.equal(matchesDateFilter("2026-09-06T18:00:00.000Z", "weekend", "Europe/Athens", monday), false);
assert.equal(matchesDateFilter("2026-09-11T18:00:00.000Z", "weekend", "Europe/Athens", monday), true);

const athensBoundaryNow = new Date("2026-09-05T22:30:00.000Z");
assert.equal(matchesDateFilter("2026-09-05T22:10:00.000Z", "today", "Europe/Athens", athensBoundaryNow, "2026-09-05T23:00:00.000Z"), true);
assert.equal(matchesDateFilter("2026-09-05T20:30:00.000Z", "today", "Europe/Athens", athensBoundaryNow, "2026-09-05T20:50:00.000Z"), false);

const multiDayStart = "2026-09-05T18:00:00.000Z";
const multiDayEnd = "2026-09-07T08:00:00.000Z";
assert.equal(isEventHappeningNow(multiDayStart, multiDayEnd, sunday.getTime()), true);
assert.equal(matchesDateFilter(multiDayStart, "today", "Europe/Athens", sunday, multiDayEnd), true);
assert.equal(matchesDateFilter(multiDayStart, "tomorrow", "Europe/Athens", sunday, multiDayEnd), true);
assert.equal(matchesDateFilter(multiDayStart, "weekend", "Europe/Athens", sunday, multiDayEnd), true);
assert.equal(eventInterval(multiDayStart, multiDayEnd)?.endSource, "provided");
assert.equal(eventInterval(multiDayStart, null)?.endSource, "fallback");
assert.equal(eventInterval(multiDayStart, "invalid")?.endSource, "fallback");

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
const combinedEvent = { title: "NOXA Night Meet", organizer: "North Crew", city: "Thessaloniki", eventType: "car_meet", startsAt: "2026-09-05T18:00:00.000Z", endsAt: "2026-09-05T21:00:00.000Z", timezone: "Europe/Athens" };
assert.equal(matchesDiscoveryEvent(combinedEvent, combinedState, "en", now), true);
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, city: "Athens" }, combinedState, "en", now), false);
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, eventType: "moto_meet" }, combinedState, "en", now), false);

const motorsportState = { country: "GR", city: "all", type: "motorsport", date: "all", q: "" };
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, eventType: "karting" }, motorsportState, "en", now), true);
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, eventType: "dexterity" }, motorsportState, "en", now), true);
assert.equal(matchesDiscoveryEvent({ ...combinedEvent, eventType: "car_meet" }, motorsportState, "en", now), false);

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

const multiDayCalendar = { ...calendarEvent, startsAt: multiDayStart, endsAt: multiDayEnd };
const multiDayIcs = buildIcsCalendar(multiDayCalendar, "https://noxastreetapp.com/meets/multi", now);
assert.match(multiDayIcs, /DTEND:20260907T080000Z/);
const multiDayGoogle = new URL(buildGoogleCalendarUrl(multiDayCalendar, "https://noxastreetapp.com/meets/multi"));
assert.equal(multiDayGoogle.searchParams.get("dates"), "20260905T180000Z/20260907T080000Z");

console.log("meets growth fixtures: PASS");
