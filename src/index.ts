import chromium from "chrome-aws-lambda";
import SlackNotify from "slack-notify";

const currentOptions = [
  "",
  "Stipendiat bei Finanzierung durch deutsche Wissenschafts- oder Mittlerorganisation z.B. DAAD oder AvH/Recipient of a full scholarship paid by an official German academic institution e.g. DAAD or AvH",
  "Promotionsstudenten mit Zulassung einer deutschen Universität/Phd students holding an admission letter from a german university",
  "Masterstudenten mit direkter Zulassung ohne Bedingungen für das Sommersemester 2023/Master students holding an unconditional direct admission letter from a German university valid for summer semester 2023",
  "Bachelorstudenten mit direkter Zulassung ohne Bedingungen für das Sommersemester 2023/Bachelor students holding an unconditional direct admission letter from a German university valid for summer semester 2023",
  "Studienvorbereitung (z.B. Sprachkurs mit anschließendem Studienkolleg)/Study preparation (e.g. language course followed by a foundation course)",
  "Sprachkurse zu anderen als Studienzwecken/Language courses for purposes other than study",
];

export const handler = async () => {
  try {
    await main();
  } catch (e) {
    await sendSlackMessage("error detected " + e.message);
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
    "https://service2.diplo.de/rktermin/extern/appointment_showForm.do?locationCode=isla&realmId=108&categoryId=1600",
    { waitUntil: "domcontentloaded" }
  );
  const select = await page.$<HTMLSelectElement>(
    "#appointment_newAppointmentForm_fields_3__content"
  );
  if (!select) {
    throw new Error("could not find select");
  }
  const newOptions = await page.evaluate(() => {
    const select = document.querySelector<HTMLSelectElement>(
      "#appointment_newAppointmentForm_fields_3__content"
    );
    if (!select) {
      throw new Error("select not found!");
    }
    return Array.from(select.options, (s) => s.innerText);
  });
  console.log(newOptions);
  const hasNewOption = !equals(newOptions, currentOptions);
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
