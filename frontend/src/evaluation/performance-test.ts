import { chromium } from "playwright";

(async () => {
  console.log("Starting performance test...");
  // Launch a new browser instance
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to your web app
  await page.goto("http://localhost:5173/static/");
  console.log("Navigated to the web app.");

  // --- Start of the automated test ---

  // Preparation: Open the side menu if it's not already open
  await page.click('[data-testId="open-menu-button"]');
  console.log("Opened side menu.");

  // Get all options from the dropdown, excluding the placeholder
  const fileOptions = await page.$$eval(
    '[data-testId="file-dropdown"] option',
    (options) =>
      options.filter((opt) => opt.value !== "").map((opt) => opt.value),
  );

  console.log("Found test files:", fileOptions);

  for (const file of fileOptions) {
    console.log(`\n--- Starting test for file: ${file} ---`);

    await page.evaluate((fileName) => {
      // Assuming your functions are globally accessible (e.g., exposed on the window object)
      // or that the module is loaded and callable.
      // We pass the filename as context for better logging.
      window.startTracking({
        type: "file-load-script",
        filename: fileName,
      });
    }, file); // Pass the 'file' variable into the browser context

    // Step 1: Select the file from the dropdown
    await page.selectOption('[data-testId="file-dropdown"]', file);

    await page.click("#load-button");
    console.log(`Clicked load button`);

    await page.waitForTimeout(500); // Small delay to ensure the button state updates

    await page.waitForSelector('#load-button[data-status="idle"]');

    await page.waitForTimeout(500); // Small delay to ensure the UI updates

    // Step 2: WAIT for the graph visualization to be complete.
    await page.waitForSelector('[data-testId="loading-screen"]', {
      state: "hidden",
    });

    console.log("Graph visualization complete. Collecting performance data...");

    const sessionData = await page.evaluate(() => {
      // Call your endTracking function and return the data object
      return window.endTracking();
    });

    console.log("Graph visualization complete. Performance data:");
    console.log(`Total duration: ${sessionData?.totalDuration.toFixed(2)}ms`);

    // Log the function timings from the returned data
    if (sessionData && sessionData.functionTimings) {
      console.table(
        sessionData.functionTimings.map((timing) => ({
          Function: timing.name,
          "Duration (ms)": timing.duration.toFixed(2),
        })),
      );
    }

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

  await page.evaluate(() => {
    window.showPerformanceSummary();
    window.exportPerformanceCSV();
  });

  // --- End of the automated test ---
  await browser.close();
})();
