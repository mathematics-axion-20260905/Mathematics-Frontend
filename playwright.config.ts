import { defineConfig, devices } from "@playwright/test";

const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;

export default defineConfig({
    testDir: "./e2e",
    timeout: 90_000,
    expect: {
        timeout: 8_000,
    },
    fullyParallel: false,
    workers: 2,
    retries: 0,
    use: {
        baseURL: "http://127.0.0.1:3005",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    webServer: {
        command: "npm run dev -- --hostname 127.0.0.1 --port 3005",
        url: "http://127.0.0.1:3005",
        reuseExistingServer: true,
        timeout: 120_000,
    },
    projects: [
        {
            name: "chromium",
            use: {
                ...devices["Desktop Chrome"],
                launchOptions: executablePath ? { executablePath } : undefined,
            },
        },
    ],
});
