import chromium from "chrome-aws-lambda";
import SlackNotify from "slack-notify";

const currentOptions = [
  "",
  "Wintersemester 2022-2023/Winter semester 2022-2023",
  "Sommersemester 2023/Summer semester 2023",
  "Sprachkurs oder Sonstiges ohne Zulassung/Language course or others without admission",
];

export const handler = async () => {
  console.log("running handler");
  await main();
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
  await sendSlackMessage();
  if (!hasNewOption) {
    return;
  }
  await sendSlackMessage();
}

function equals(arr1: string[], arr2: string[]): boolean {
  return arr1.every((el) => arr2.includes(el));
}

async function sendSlackMessage(): Promise<void> {
  const MY_SLACK_WEBHOOK_URL =
    "https://hooks.slack.com/services/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";
  const slack = SlackNotify(MY_SLACK_WEBHOOK_URL);
  await slack.send("visa appointment available.");
}
