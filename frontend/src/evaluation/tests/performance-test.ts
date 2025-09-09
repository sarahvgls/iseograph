import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";

// This is the ES Module way to get the directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  console.log("Starting performance test...");
  const testStartTime = Date.now();

  // Define a custom download path.
  const customDownloadPath = path.join(__dirname, "./../downloads");

  // Launch a new browser instance
  const browser = await chromium.launch();
  const context = await browser.newContext({
    acceptDownloads: true,
    downloadsPath: customDownloadPath,
  });

  const page = await context.newPage();

  // Set default timeout for all page operations
  page.setDefaultTimeout(60000); // 60 seconds

  let testFailed = false;
  let failureReason = "";

  let stepStartTime = Date.now();

  try {
    // Navigate to your web app
    await page.goto("http://localhost:5173/static/", { timeout: 60000 });
    console.log(`Navigated to the web app. (${Date.now() - stepStartTime}ms)`);

    // Preparation: Clear any existing performance data
    stepStartTime = Date.now();
    await page.click('[data-testId="reset-button"]');
    console.log(`Reset performance data. (${Date.now() - stepStartTime}ms)`);

    await page.click('[data-testId="peptides-menu-close-button"]'); // close overlapping menu

    // Preparation: Open the side menu
    stepStartTime = Date.now();
    await page.click('[data-testId="open-menu-button"]');
    console.log(`Opened side menu. (${Date.now() - stepStartTime}ms)`);

    // Get all options from the dropdown, excluding the placeholder
    stepStartTime = Date.now();
    let fileOptions = await page.$$eval(
      '[data-testId="file-dropdown"] option',
      (options) =>
        options.filter((opt) => opt.value !== "").map((opt) => opt.value),
    );
    console.log(
      `Found test files: ${fileOptions} (${Date.now() - stepStartTime}ms)`,
    );

    // Sort test files by number in their filename
    fileOptions.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0", 10);
      const numB = parseInt(b.match(/\d+/)?.[0] || "0", 10);
      return numA - numB;
    });
    console.log(`Sorted test files: ${fileOptions}`);

    stepStartTime = Date.now();
    await page.click('[data-testId="close-menu-button"]');
    console.log(`Closed side menu. (${Date.now() - stepStartTime}ms)`);

    for (const file of fileOptions) {
      const fileStartTime = Date.now();
      console.log(`\n--- Starting test for file: ${file} ---`);

      try {
        await page.click('[data-testId="peptides-menu-close-button"]'); // close overlapping menu

        stepStartTime = Date.now();
        await page.click('[data-testId="open-menu-button"]');
        console.log(`Opened side menu. (${Date.now() - stepStartTime}ms)`);

        // Step 1: Select the file from the dropdown
        stepStartTime = Date.now();
        await page.selectOption('[data-testId="file-dropdown"]', file);
        console.log(
          `Selected file from dropdown. (${Date.now() - stepStartTime}ms)`,
        );

        // Step 2: Click the button to load the file
        stepStartTime = Date.now();
        await page.click("#load-button");
        console.log(`Clicked load button. (${Date.now() - stepStartTime}ms)`);

        // Step 3: Wait for the button to become idle again
        stepStartTime = Date.now();
        await page.waitForSelector('#load-button[data-status="idle"]', {
          timeout: 600000,
        }); // 10 minutes
        console.log(
          `Load button became idle. (${Date.now() - stepStartTime}ms)`,
        );

        // Step 4: Wait for the graph visualization to be complete.
        stepStartTime = Date.now();
        await page.waitForSelector('[data-testId="loading-screen"]', {
          state: "hidden",
          timeout: 600000, // 10 minutes
        });
        console.log(
          `Graph visualization complete. (${Date.now() - stepStartTime}ms)`,
        );

        // Close the side menu
        stepStartTime = Date.now();
        await page.click('[data-testId="close-menu-button"]');
        console.log(`Closed side menu. (${Date.now() - stepStartTime}ms)`);

        // Step 5: First node width mode sequence - small → expanded → collapsed
        console.log(
          "Starting first node width mode sequence: small → expanded → collapsed",
        );

        const firstSequenceStartTime = Date.now();
        const firstNodeWidthSequence = ["small", "expanded", "collapsed"];
        for (const widthOption of firstNodeWidthSequence) {
          stepStartTime = Date.now();
          console.log(`Testing node width mode: ${widthOption}`);

          // Click the option
          await page.click(
            `[data-testid="node-width-mode-switch-option-${widthOption}"]`,
            { timeout: 600000 }, // 10 minutes
          );

          // Wait for the switch to finish loading and have the option selected
          await page.waitForFunction(
            (option) => {
              const switchElement = document.querySelector(
                '[data-testid="node-width-mode-switch"]',
              );
              return (
                switchElement &&
                switchElement.getAttribute("data-selected") === option &&
                switchElement.getAttribute("data-loading") === "false"
              );
            },
            widthOption,
            { timeout: 600000 }, // 10 minutes
          );

          console.log(
            `Node width mode switched to: ${widthOption} (${Date.now() - stepStartTime}ms)`,
          );
          await page.waitForTimeout(500);
        }
        console.log(
          `First node width sequence completed. (${Date.now() - firstSequenceStartTime}ms)`,
        );

        // Step 6: Layout mode change to linear
        stepStartTime = Date.now();
        console.log("Switching layout mode to linear");

        await page.click(
          `[data-testid="layout-mode-switch-option-linear"]`,
          { timeout: 600000 }, // 10 minutes
        );

        await page.waitForFunction(
          () => {
            const switchElement = document.querySelector(
              '[data-testid="layout-mode-switch"]',
            );
            return (
              switchElement &&
              switchElement.getAttribute("data-selected") === "linear" &&
              switchElement.getAttribute("data-loading") === "false"
            );
          },
          {},
          { timeout: 600000 }, // 10 minutes
        );

        console.log(
          `Layout mode switched to: linear (${Date.now() - stepStartTime}ms)`,
        );
        await page.waitForTimeout(500);

        // Step 7: Second node width mode sequence - small → expanded
        console.log(
          "Starting second node width mode sequence: small → expanded",
        );

        const secondSequenceStartTime = Date.now();
        const secondNodeWidthSequence = ["small", "expanded"];
        for (const widthOption of secondNodeWidthSequence) {
          stepStartTime = Date.now();
          console.log(`Testing node width mode: ${widthOption}`);

          // Click the option
          await page.click(
            `[data-testid="node-width-mode-switch-option-${widthOption}"]`,
            { timeout: 600000 }, // 10 minutes
          );

          // Wait for the switch to finish loading and have the option selected
          await page.waitForFunction(
            (option) => {
              const switchElement = document.querySelector(
                '[data-testid="node-width-mode-switch"]',
              );
              return (
                switchElement &&
                switchElement.getAttribute("data-selected") === option &&
                switchElement.getAttribute("data-loading") === "false"
              );
            },
            widthOption,
            { timeout: 600000 }, // 10 minutes
          );

          console.log(
            `Node width mode switched to: ${widthOption} (${Date.now() - stepStartTime}ms)`,
          );
          await page.waitForTimeout(500);
        }
        console.log(
          `Second node width sequence completed. (${Date.now() - secondSequenceStartTime}ms)`,
        );

        console.log(
          `Completed testing sequence for file: ${file} (Total: ${Date.now() - fileStartTime}ms)`,
        );
      } catch (fileError) {
        console.error(`Error testing file ${file}:`, fileError.message);
        testFailed = true;
        failureReason = `File ${file}: ${fileError.message}`;
        // Continue to next file or proceed to export
        break;
      }
    }
  } catch (error) {
    console.error("Test failed with error:", error.message);
    testFailed = true;
    failureReason = error.message;
  }

  console.log(
    testFailed
      ? "\nTest completed with errors."
      : "\nAll tests completed successfully.",
  );

  // Export - Always attempt this even if tests failed
  try {
    console.log("Attempting to export performance data...");
    stepStartTime = Date.now();
    await page.waitForSelector('[data-testId="export-button"]:enabled', {
      timeout: 600000, // 10 minute
    });
    console.log(`Export button ready. (${Date.now() - stepStartTime}ms)`);

    stepStartTime = Date.now();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('[data-testId="export-button"]'),
    ]);
    console.log(
      `Clicked export button and download started. (${Date.now() - stepStartTime}ms)`,
    );

    stepStartTime = Date.now();
    await download.saveAs(
      path.join(customDownloadPath, "performance_data.csv"),
    );
    console.log(
      `Download saved to: ${customDownloadPath} (${Date.now() - stepStartTime}ms)`,
    );
  } catch (exportError) {
    console.error("Failed to export performance data:", exportError.message);
  }

  console.log(`\n=== TOTAL TEST TIME: ${Date.now() - testStartTime}ms ===`);

  if (testFailed) {
    console.log(`=== TEST FAILED: ${failureReason} ===`);
  }

  // --- End of the automated test ---
  await browser.close();
})();
