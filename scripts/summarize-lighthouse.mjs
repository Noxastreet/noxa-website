import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const reportDirectory = path.resolve("lighthouse-results");
const entries = await readdir(reportDirectory);
const reportFiles = entries.filter((entry) => entry.endsWith(".report.json"));

if (reportFiles.length === 0) {
  throw new Error("No Lighthouse JSON reports were found.");
}

const reports = await Promise.all(
  reportFiles.map(async (file) => {
    const content = await readFile(path.join(reportDirectory, file), "utf8");
    return JSON.parse(content);
  }),
);

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

const categories = ["performance", "accessibility", "best-practices", "seo"];
const audits = [
  ["largest-contentful-paint", "LCP", "ms"],
  ["total-blocking-time", "TBT", "ms"],
  ["cumulative-layout-shift", "CLS", ""],
];

console.log(`Lighthouse median from ${reports.length} runs`);

for (const category of categories) {
  const values = reports.map((report) => report.categories[category].score * 100);
  console.log(`${category}: ${median(values).toFixed(0)}`);
}

for (const [auditId, label, suffix] of audits) {
  const values = reports.map((report) => report.audits[auditId].numericValue);
  const value = median(values);
  const formatted =
    auditId === "cumulative-layout-shift" ? value.toFixed(3) : value.toFixed(0);
  console.log(`${label}: ${formatted}${suffix}`);
}
