import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    ...devices["Desktop Chrome"],
  },
  webServer: {
    command: "python3 -m http.server 4173 --bind 127.0.0.1 --directory demo",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
