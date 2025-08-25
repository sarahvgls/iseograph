import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

// This is the ES Module way to get the directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log("Starting performance test...");
  // Define a custom download path.
  const customDownloadPath = path.join(__dirname, "downloads");

  // Launch a new browser instance
  const browser = await chromium.launch();
  const context = await browser.newContext({
    acceptDownloads: true, // This is required for downloads to work
    downloadsPath: customDownloadPath,
  });

  const page = await context.newPage();

  // Navigate to your web app
  await page.goto("http://localhost:5173/static/");
  console.log("Navigated to the web app.");

  // Preparation: Open the side menu
  await page.click('[data-testId="open-menu-button"]');
  console.log("Opened side menu.");

  // Get all options from the dropdown, excluding the placeholder
  let fileOptions = await page.$$eval(
    '[data-testId="file-dropdown"] option',
    (options) =>
      options.filter((opt) => opt.value !== "").map((opt) => opt.value),
  );

  console.log("Found test files:", fileOptions);

  fileOptions = fileOptions.slice(0, 1);
  for (const file of fileOptions) {
    console.log(`\n--- Starting test for file: ${file} ---`);

    // Step 1: Select the file from the dropdown
    await page.selectOption('[data-testId="file-dropdown"]', file);

    // Step 2: Click the button to load the file
    await page.click("#load-button");
    console.log(`Clicked load button`);

    // Step 3: Wait for the button to become idle again
    await page.waitForSelector('#load-button[data-status="idle"]');

    // Step 4: Wait for the graph visualization to be complete.
    await page.waitForSelector('[data-testId="loading-screen"]', {
      state: "hidden",
    });

    console.log("Graph visualization complete. Next starting now...");

    // Step 3: Collect the performance data
    // const visualizationTime = await page.$eval(
    //   "#your-timestamp-element",
    //   (el) => el.textContent,
    // );
    // console.log(`Time to visualize ${file}: ${visualizationTime}`);

    // Step 4: Click the button to change the layout
    // await page.click('[data-testId="layout-change-button"]');

    // Step 5: Wait for the layout to change
    // You can use the same state-based waiting pattern.
    // e.g., wait for a different class to be added, or a different attribute value.
    // await page.waitForSelector(
    //   '#graph-container[data-layout-status="complete"]',
    // );
    //
    // console.log("Layout change complete.");
  }

  console.log("\nAll tests completed.");

  // Close the side menu
  await page.click('[data-testId="close-menu-button"]');
  console.log("Closed side menu.");

  // Export
  await page.waitForSelector('[data-testId="export-button"]:enabled', {
    timeout: 15000,
  });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click('[data-testId="export-button"]'),
  ]);
  console.log("Clicked export button.");

  await download.saveAs(path.join(customDownloadPath, "performance_data.csv"));

  console.log(`Download saved to: ${customDownloadPath}`);

  // --- End of the automated test ---
  await browser.close();
})();
