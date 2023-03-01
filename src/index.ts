import chromium from "chrome-aws-lambda";
import { Page } from "puppeteer-core";
import SlackNotify from "slack-notify";

export const handler = async () => {
  try {
    await main();
  } catch (e) {
    await sendSlackMessage("error detected " + e.message);
  }
};

const compare = [
  "Es sind keine Termine für die gewünschte Auswahl verfügbar!",
  "Keine Termine verfügbar",
];

async function main() {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();

  await page.goto("https://www.qtermin.de/qtermin-stadt-duisburg-abh-sued", {
    waitUntil: "domcontentloaded",
  });

  await page.waitForNavigation();
  await page.waitForTimeout(3000);

  await pressPlus(page, "#\\33 87843");
  await pressPlus(page, "#\\33 87844");
  await pressPlus(page, "#\\33 87845");

  await page.waitForTimeout(3000);

  (await page.$("#bp1"))?.click();

  await page.waitForTimeout(3000);

  const text =
    (await page.$eval("#divSlotsList", (el) => el.textContent)) ?? "";
  await new Promise((res) => setTimeout(res, 3000));

  console.log(text, "------------text");

  if (!compare.includes(text)) {
    await sendSlackMessage("duisburg ABH appointment is available");
  }
  await new Promise((res) => setTimeout(res, 3000));
  await browser.close();
}

async function sendSlackMessage(message: string): Promise<void> {
  const slack = SlackNotify(process?.env?.MY_SLACK_WEBHOOK_URL || "");
  await slack.send(message);
}

async function pressPlus(page: Page, id: string) {
  const card1 = await page.$(id);
  (await card1?.$(".counterPlus"))?.click();
}
