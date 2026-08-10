module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start -- -H 127.0.0.1 -p 3000",
      startServerReadyPattern: "Ready in|Local:",
      startServerReadyTimeout: 30000,
      url: ["http://127.0.0.1:3000/el"],
      numberOfRuns: 3,
      settings: {
        chromeFlags: "--headless --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.75 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.9 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "total-blocking-time": ["warn", { maxNumericValue: 350 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "lighthouse-results",
    },
  },
};
