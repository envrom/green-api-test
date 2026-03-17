import { Builder, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';

/**
 * Creates a headless Chrome WebDriver instance.
 * chromedriver binary path is resolved from the `chromedriver` npm package
 * so no system PATH setup is needed.
 */
export async function buildDriver(): Promise<WebDriver> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const chromedriverPath: string = require('chromedriver').path;

  const service = new chrome.ServiceBuilder(chromedriverPath);

  const options = new chrome.Options();
  options.addArguments(
    '--headless=new',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--window-size=1280,900',
    '--lang=en-US',
  );

  return new Builder()
    .forBrowser('chrome')
    .setChromeService(service)
    .setChromeOptions(options)
    .build();
}
