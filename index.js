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
    "Wintersemester 2022-2023/Winter semester 2022-2023",
    "Sommersemester 2023/Summer semester 2023",
    "Sprachkurs oder Sonstiges ohne Zulassung/Language course or others without admission",
];
const handler = async () => {
    console.log("running handler");
    await main();
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
    await page.goto("https://service2.diplo.de/rktermin/extern/appointment_showForm.do?locationCode=isla&realmId=108&categoryId=1600");
    const select = await page.$("#appointment_newAppointmentForm_fields_3__content");
    if (!select) {
        throw new Error("could not find select");
    }
    const newOptions = await page.evaluate(() => {
        const select = document.querySelector("#appointment_newAppointmentForm_fields_4__content");
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
function equals(arr1, arr2) {
    return arr1.every((el) => arr2.includes(el));
}
async function sendSlackMessage() {
    const MY_SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";
    const slack = (0, slack_notify_1.default)(MY_SLACK_WEBHOOK_URL);
    await slack.send("visa appointment available.");
}
