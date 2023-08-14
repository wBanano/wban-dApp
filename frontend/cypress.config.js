const { defineConfig } = require("cypress");
const synpressPlugins = require("@synthetixio/synpress/plugins");

module.exports = defineConfig({
	projectId: "2p7qw6",
  userAgent: "synpress",
  chromeWebSecurity: true,
  defaultCommandTimeout: 30000,
  pageLoadTimeout: 30000,
  requestTimeout: 30000,
  e2e: {
    testIsolation: true,
    setupNodeEvents(on, config) {
      synpressPlugins(on, config);
    },
    baseUrl: "http://localhost:8080",
    supportFile: "tests/support/e2e.ts",
		specPattern: "tests/e2e/**/*.spec.{js,jsx,ts,tsx}",
  },
});
