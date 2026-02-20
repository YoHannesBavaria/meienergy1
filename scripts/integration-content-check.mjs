import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "src", "data", "site-structure.json");

const raw = await fs.readFile(dataPath, "utf8");
const data = JSON.parse(raw);

if (!Array.isArray(data.routePaths) || data.routePaths.length < 50) {
  throw new Error("Route coverage is unexpectedly low in site-structure.json");
}

if (!Array.isArray(data.primaryMenu) || data.primaryMenu.length < 8) {
  throw new Error("Main menu is incomplete in site-structure.json");
}

if (!Array.isArray(data.pages) || data.pages.length < 50) {
  throw new Error("Content corpus is unexpectedly small in site-structure.json");
}

const requiredRoutes = ["/", "/ueber-uns", "/kursuebersicht", "/unsere-angebote", "/kontakt"];
for (const route of requiredRoutes) {
  if (!data.routePaths.includes(route)) {
    throw new Error(`Required legacy route is missing: ${route}`);
  }
}

const spamPage = data.pages.find((page) => /casino|jackpot|slot|betting/i.test(String(page.path || "")));
if (spamPage) {
  throw new Error(`Spam-like route should not be in migrated dataset: ${spamPage.path}`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      routes: data.routePaths.length,
      pages: data.pages.length,
      menu: data.primaryMenu.length,
    },
    null,
    2,
  ),
);
