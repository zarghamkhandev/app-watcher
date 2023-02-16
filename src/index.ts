import chromium from "chrome-aws-lambda";
import { Page } from "puppeteer-core";
import SlackNotify from "slack-notify";

export const handler = async () => {
  try {
    await main();
  } catch (e) {
    await sendSlackMessage("error detected " + e?.message);
  }
};

/* handler().catch(console.log); */

async function main() {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
    slowMo: 100,
  });
  const page = await browser.newPage();

  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36"
  );

  await page.goto(
    "https://patienten.helios-gesundheit.de/appointments/book-appointment?facility=215&physician=83318&purpose=51438",
    {
      waitUntil: "networkidle2",
    }
  );

  await acceptCookies(page);
  await navigateToStart(page);
  const terminAvailable = await hasTermin(page);
  if (terminAvailable) {
    await sendSlackMessage("HNO termin is available");
  }

  await browser.close();
}

async function goNext(page: Page) {
  const btn = await page.$<HTMLButtonElement>(
    ".flickity-prev-next-button.next"
  );
  return btn?.click();
}

async function hasTermin(page: Page) {
  let has = await hasNoticeSection(page);
  if (has) {
    return true;
  }
  await goNext(page);
  return hasNoticeSection(page);
}

async function hasNoticeSection(page: Page) {
  const calenderSection = await page.$<HTMLDivElement>(".calendar__notice");
  return !calenderSection;
}

async function navigateToStart(page: Page) {
  await page.waitForSelector(".flickity-prev-next-button.previous");
  //
  let btn = await page.$<HTMLButtonElement>(
    ".flickity-prev-next-button.previous"
  );
  let disabled = await (await btn?.getProperty("disabled"))?.jsonValue();

  while (!disabled) {
    await btn?.click();
    await page.waitForTimeout(500);
    btn = await page.$<HTMLButtonElement>(".flickity-prev-next-button");
    disabled = await (await btn?.getProperty("disabled"))?.jsonValue();
  }
}
async function acceptCookies(page: Page) {
  await page.waitForSelector("#popup__content .button-core-secondary");
  const btn = await page.$("#popup__content .button-core-secondary");
  return btn?.click();
}

async function sendSlackMessage(message: string): Promise<void> {
  const slack = SlackNotify(process?.env?.MY_SLACK_WEBHOOK_URL || "");
  await slack.send(message);
}
