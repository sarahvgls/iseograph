import path from "path";
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const fs = await import("fs");

// This is the ES Module way to get the directory name.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a custom download path.
const customDownloadPath = path.join(__dirname, "./../downloads");

(async () => {
  // scrape uniprot for random proteins
  const NUM_PROTEINS = 1000;
  const file_names = [
    "./../uniprotkb_ft_positional_VAR_SEQ_2025_08_26.list",
    "./../uniprotkb_AND_reviewed_true_2025_08_27.list",
  ];

  for (const file_name of file_names) {
    // randomly select NUM_PROTEINS from uniprot protein list
    const allProteins = fs
      .readFileSync(new URL(file_name, import.meta.url), "utf-8")
      .split("\n")
      .filter((line) => line.trim().length > 0);

    const selectedProteins: string[] = [];
    while (selectedProteins.length < NUM_PROTEINS) {
      const randomIndex = Math.floor(Math.random() * allProteins.length);
      const protein = allProteins[randomIndex];
      if (!selectedProteins.includes(protein)) {
        selectedProteins.push(protein);
      }
    }
    console.log("Selected proteins:", selectedProteins);

    // Save the selected proteins to a file for reference
    const proteinListFilename = `selected_proteins_${new Date().toISOString().slice(0, 10)}_${new Date().toTimeString().slice(0, 8).replace(/:/g, "-")}.txt`;
    const proteinListPath = path.join(customDownloadPath, proteinListFilename);

    // Ensure download directory exists
    if (!fs.existsSync(customDownloadPath)) {
      fs.mkdirSync(customDownloadPath, { recursive: true });
    }

    // Write protein list with metadata
    const proteinListContent = [
      `# Random Protein Selection for Measuring Test`,
      `# Generated: ${new Date().toISOString()}`,
      `# Total proteins: ${selectedProteins.length}`,
      `# Source file: ${file_name}`,
      ``,
      ...selectedProteins.map((protein) => `${protein}`),
    ].join("\n");

    fs.writeFileSync(proteinListPath, proteinListContent, "utf-8");
    console.log(`Saved protein list to: ${proteinListPath}`);

    const testStartTime = Date.now();

    // Launch a new browser instance
    const browser = await chromium.launch();
    const context = await browser.newContext({
      acceptDownloads: true,
      downloadsPath: customDownloadPath,
    });

    const page = await context.newPage();

    // Set default timeout for all page operations
    page.setDefaultTimeout(600000); // 60 seconds

    await page.goto("http://localhost:5173/static/", { timeout: 600000 });

    // Reset measuring data
    await page.click('[data-testId="reset-row-button"]');
    console.log("Reset row data.");

    let stepStartTime = Date.now();

    // load proteins
    for (const protein of selectedProteins) {
      // Preparation: Open the side menu
      await page.click('[data-testId="peptides-menu-close-button"]'); // close overlapping menu
      await page.click('[data-testId="open-menu-button"]');
      console.log(`Opened side menu. (${Date.now() - stepStartTime}ms)`);

      // Load protein
      stepStartTime = Date.now();
      await page.fill('[data-testid="new-protein-name-input"]', protein);
      await page.click('[data-testid="add-protein-button"]');
      console.log(
        `Loaded protein ${protein}. (${Date.now() - stepStartTime}ms)`,
      );

      // Wait for the button to become idle again
      stepStartTime = Date.now();
      await page.waitForSelector('#add-button[data-status="idle"]', {
        timeout: 600000,
      }); // 10 minutes
      console.log(`Load button became idle. (${Date.now() - stepStartTime}ms)`);

      // Close the side menu
      await page.click('[data-testId="close-menu-button"]');
      console.log("Closed side menu.");

      // select expanded nodes
      stepStartTime = Date.now();
      // Click the option
      await page.click(
        `[data-testid="node-width-mode-switch-option-expanded"]`,
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
        "expanded",
        { timeout: 600000 }, // 10 minutes
      );

      // change to linear layout
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

      await page.waitForTimeout(500);

      // switch back to snake layout
      await page.click(
        `[data-testid="layout-mode-switch-option-snake"]`,
        { timeout: 600000 }, // 10 minutes
      );

      await page.waitForFunction(
        () => {
          const switchElement = document.querySelector(
            '[data-testid="layout-mode-switch"]',
          );
          return (
            switchElement &&
            switchElement.getAttribute("data-selected") === "snake" &&
            switchElement.getAttribute("data-loading") === "false"
          );
        },
        {},
        { timeout: 600000 }, // 10 minutes
      );

      await page.waitForTimeout(500);

      console.log(`Protein ${protein} successfully. Trying next one...`);
    }

    // download measuring results
    try {
      console.log("Attempting to export measuring data...");
      stepStartTime = Date.now();
      await page.waitForSelector('[data-testId="export-row-button"]:enabled', {
        timeout: 600000, // 10 minute
      });
      console.log(`Export button ready. (${Date.now() - stepStartTime}ms)`);

      stepStartTime = Date.now();
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.click('[data-testId="export-row-button"]'),
      ]);
      console.log(
        `Clicked export button and download started. (${Date.now() - stepStartTime}ms)`,
      );

      stepStartTime = Date.now();
      const measuringDataFilename = `row_data_${new Date().toISOString().slice(0, 10)}_${new Date().toTimeString().slice(0, 8).replace(/:/g, "-")}.csv`;
      await download.saveAs(
        path.join(customDownloadPath, measuringDataFilename),
      );
      console.log(
        `Download saved to: ${path.join(customDownloadPath, measuringDataFilename)} (${Date.now() - stepStartTime}ms)`,
      );
    } catch (exportError) {
      console.error("Failed to export row data:", exportError.message);
    }

    await browser.close();
    console.log(`Test completed in ${Date.now() - testStartTime}ms`);
  }

  console.log("All tests completed.");
})();
