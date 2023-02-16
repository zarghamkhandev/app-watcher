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
        await sendSlackMessage("error detected " + (e === null || e === void 0 ? void 0 : e.message));
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
        slowMo: 100,
    });
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36");
    await page.goto("https://patienten.helios-gesundheit.de/appointments/book-appointment?facility=215&physician=83318&purpose=51438", {
        waitUntil: "networkidle2",
    });
    await acceptCookies(page);
    await navigateToStart(page);
    const terminAvailable = await hasTermin(page);
    if (terminAvailable) {
        await sendSlackMessage("HNO termin is available");
    }
    await browser.close();
}
async function goNext(page) {
    const btn = await page.$(".flickity-prev-next-button.next");
    return btn === null || btn === void 0 ? void 0 : btn.click();
}
async function hasTermin(page) {
    let has = await hasNoticeSection(page);
    if (has) {
        return true;
    }
    await goNext(page);
    return hasNoticeSection(page);
}
async function hasNoticeSection(page) {
    const calenderSection = await page.$(".calendar__notice");
    return !calenderSection;
}
async function navigateToStart(page) {
    var _a, _b;
    await page.waitForSelector(".flickity-prev-next-button.previous");
    let btn = await page.$(".flickity-prev-next-button.previous");
    let disabled = await ((_a = (await (btn === null || btn === void 0 ? void 0 : btn.getProperty("disabled")))) === null || _a === void 0 ? void 0 : _a.jsonValue());
    while (!disabled) {
        await (btn === null || btn === void 0 ? void 0 : btn.click());
        await page.waitForTimeout(500);
        btn = await page.$(".flickity-prev-next-button");
        disabled = await ((_b = (await (btn === null || btn === void 0 ? void 0 : btn.getProperty("disabled")))) === null || _b === void 0 ? void 0 : _b.jsonValue());
    }
}
async function acceptCookies(page) {
    await page.waitForSelector("#popup__content .button-core-secondary");
    const btn = await page.$("#popup__content .button-core-secondary");
    return btn === null || btn === void 0 ? void 0 : btn.click();
}
async function sendSlackMessage(message) {
    var _a;
    const slack = (0, slack_notify_1.default)(((_a = process === null || process === void 0 ? void 0 : process.env) === null || _a === void 0 ? void 0 : _a.MY_SLACK_WEBHOOK_URL) || "");
    await slack.send(message);
}
