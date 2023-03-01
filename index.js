"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const chrome_aws_lambda_1 = __importDefault(require("chrome-aws-lambda"));
const slack_notify_1 = __importDefault(require("slack-notify"));
const handler = async () => {
    try {
        await main();
    }
    catch (e) {
        await sendSlackMessage("error detected " + e.message);
    }
};
exports.handler = handler;
const compare = [
    "Es sind keine Termine für die gewünschte Auswahl verfügbar!",
    "Keine Termine verfügbar",
];
async function main() {
    var _a, _b;
    const browser = await chrome_aws_lambda_1.default.puppeteer.launch({
        args: chrome_aws_lambda_1.default.args,
        defaultViewport: chrome_aws_lambda_1.default.defaultViewport,
        executablePath: await chrome_aws_lambda_1.default.executablePath,
        headless: chrome_aws_lambda_1.default.headless,
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
    (_a = (await page.$("#bp1"))) === null || _a === void 0 ? void 0 : _a.click();
    await page.waitForTimeout(3000);
    const text = (_b = (await page.$eval("#divSlotsList", (el) => el.textContent))) !== null && _b !== void 0 ? _b : "";
    await new Promise((res) => setTimeout(res, 3000));
    console.log(text, "------------text");
    if (!compare.includes(text)) {
        await sendSlackMessage("duisburg ABH appointment is available");
    }
    await new Promise((res) => setTimeout(res, 3000));
    await browser.close();
}
async function sendSlackMessage(message) {
    var _a;
    const slack = (0, slack_notify_1.default)(((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.MY_SLACK_WEBHOOK_URL) || "");
    await slack.send(message);
}
async function pressPlus(page, id) {
    var _a;
    const card1 = await page.$(id);
    (_a = (await (card1 === null || card1 === void 0 ? void 0 : card1.$(".counterPlus")))) === null || _a === void 0 ? void 0 : _a.click();
}
