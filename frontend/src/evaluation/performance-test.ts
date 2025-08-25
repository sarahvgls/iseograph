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

  await page.click('[data-testId="close-menu-button"]');
  console.log("Closed side menu.");

  fileOptions = fileOptions.slice(0, 1);
  for (const file of fileOptions) {
    console.log(`\n--- Starting test for file: ${file} ---`);

    await page.click('[data-testId="open-menu-button"]');
    console.log("Opened side menu.");

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

    console.log("Graph visualization complete. Switch modes now...");

    // Close the side menu
    await page.click('[data-testId="close-menu-button"]');
    console.log("Closed side menu.");

    // Step 5: Interact with layout mode switch
    const layoutModeOptions = await page.$$eval(
      '[data-testid="layout-mode-switch"] button[data-option]',
      (buttons) =>
        buttons.map((btn) => btn.getAttribute("data-option")).filter(Boolean),
    );

    console.log("Found layout mode options:", layoutModeOptions);

    for (const layoutOption of layoutModeOptions) {
      console.log(`Testing layout mode: ${layoutOption}`);

      // Click the option
      await page.click(
        `[data-testid="layout-mode-switch-option-${layoutOption}"]`,
      );

      // Wait for the switch to finish loading and have the option selected
      await page.waitForFunction(
        (option) => {
          const switchElement = document.querySelector(
            '[data-testid="layout-mode-switch"]',
          );
          return (
            switchElement &&
            switchElement.getAttribute("data-selected") === option &&
            switchElement.getAttribute("data-loading") === "false"
          );
        },
        layoutOption,
        { timeout: 10000 },
      );

      console.log(`Layout mode switched to: ${layoutOption}`);

      // Small delay between switches
      await page.waitForTimeout(500);
    }

    // Step 6: Interact with node width mode switch
    const nodeWidthModeOptions = await page.$$eval(
      '[data-testid="node-width-mode-switch"] button[data-option]',
      (buttons) =>
        buttons.map((btn) => btn.getAttribute("data-option")).filter(Boolean),
    );

    console.log("Found node width mode options:", nodeWidthModeOptions);

    for (const widthOption of nodeWidthModeOptions) {
      console.log(`Testing node width mode: ${widthOption}`);

      // Click the option
      await page.click(
        `[data-testid="node-width-mode-switch-option-${widthOption}"]`,
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
        { timeout: 10000 },
      );

      console.log(`Node width mode switched to: ${widthOption}`);

      // Small delay between switches
      await page.waitForTimeout(500);
    }
  }

  console.log("\nAll tests completed.");

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
