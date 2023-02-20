"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const chrome_aws_lambda_1 = __importDefault(require("chrome-aws-lambda"));
const slack_notify_1 = __importDefault(require("slack-notify"));
const currentOptions = [
    "",
    "Stipendiat bei Finanzierung durch deutsche Wissenschafts- oder Mittlerorganisation z.B. DAAD oder AvH/Recipient of a full scholarship paid by an official German academic institution e.g. DAAD or AvH",
    "Promotionsstudenten mit Zulassung einer deutschen Universität/Phd students holding an admission letter from a german university",
    "Masterstudenten mit direkter Zulassung ohne Bedingungen für das Sommersemester 2023/Master students holding an unconditional direct admission letter from a German university valid for summer semester 2023",
    "Bachelorstudenten mit direkter Zulassung ohne Bedingungen für das Sommersemester 2023/Bachelor students holding an unconditional direct admission letter from a German university valid for summer semester 2023",
    "Studienvorbereitung (z.B. Sprachkurs mit anschließendem Studienkolleg)/Study preparation (e.g. language course followed by a foundation course)",
    "Sprachkurse zu anderen als Studienzwecken/Language courses for purposes other than study",
];
const handler = async () => {
    try {
        await main();
    }
    catch (e) {
        await sendSlackMessage("error detected " + e.message);
    }
};
exports.handler = handler;
async function main() {
    const browser = await chrome_aws_lambda_1.default.puppeteer.launch({
        args: chrome_aws_lambda_1.default.args,
        defaultViewport: chrome_aws_lambda_1.default.defaultViewport,
        executablePath: await chrome_aws_lambda_1.default.executablePath,
        headless: chrome_aws_lambda_1.default.headless,
        ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.goto("https://service2.diplo.de/rktermin/extern/appointment_showForm.do?locationCode=isla&realmId=108&categoryId=1600", { waitUntil: "domcontentloaded" });
    const select = await page.$("#appointment_newAppointmentForm_fields_3__content");
    if (!select) {
        throw new Error("could not find select");
    }
    const newOptions = await page.evaluate(() => {
        const select = document.querySelector("#appointment_newAppointmentForm_fields_3__content");
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
function equals(arr1, arr2) {
    return arr1.every((el) => arr2.includes(el));
}
async function sendSlackMessage(message) {
    var _a;
    const slack = (0, slack_notify_1.default)(((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.MY_SLACK_WEBHOOK_URL) || "");
    await slack.send(message);
}
