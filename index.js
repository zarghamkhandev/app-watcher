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
    "Sommersemester 2023/summer semester 2023",
    "Sprachkurs oder Sonstiges ohne Zulassung/Language course or others without admission",
];
const handler = async () => {
    try {
        await main();
    }
    catch (e) {
        await sendSlackMessage("error detected");
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
