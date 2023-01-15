import chromium from "chrome-aws-lambda";
import SlackNotify from "slack-notify";

const currentOptions = [
  "",
  "Wintersemester 2022-2023/Winter semester 2022-2023",
  "Sommersemester 2023/Summer semester 2023",
  "Sprachkurs oder Sonstiges ohne Zulassung/Language course or others without admission",
];

export const handler = async () => {
  try {
    await main();
  } catch (e) {
    await sendSlackMessage("error detected");
  }
};

async function main() {
  const browser = await chromium.puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath,
    headless: chromium.headless,
    ignoreHTTPSErrors: true,
  });
  const page = await browser.newPage();
  await page.goto(
    "https://service2.diplo.de/rktermin/extern/appointment_showForm.do?locationCode=isla&realmId=108&categoryId=1600"
  );
  const select = await page.$<HTMLSelectElement>(
    "#appointment_newAppointmentForm_fields_3__content"
  );
  if (!select) {
    throw new Error("could not find select");
  }
  const newOptions = await page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>(
      "#appointment_newAppointmentForm_fields_4__content"
    );
    if (!select) {
      throw new Error("select not found!");
    }
    return Array.from(select.options, (s) => s.innerText);
  });
  const hasNewOption = !equals(newOptions, currentOptions);
  await sendSlackMessage("visa appointment available.");
  if (!hasNewOption) {
    return;
  }
  await sendSlackMessage("visa appointment available.");
  await browser.close();
}

function equals(arr1: string[], arr2: string[]): boolean {
  return arr1.every((el) => arr2.includes(el));
}

async function sendSlackMessage(message: string): Promise<void> {
  const slack = SlackNotify(process?.env?.MY_SLACK_WEBHOOK_URL || "");
  await slack.send(message);
}
