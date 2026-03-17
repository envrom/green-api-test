import { WebDriver, By, until } from 'selenium-webdriver';
import { buildDriver } from './browser';

/**
 * Selenium smoke tests — GREEN-API SendMessage documentation page
 * URL: https://green-api.com/docs/api/sending/SendMessage/
 *
 * These tests verify that the documentation page is reachable and contains
 * the correct content: method name, endpoint URL, request parameters,
 * and a response example.
 *
 * They do NOT interact with the live API — that is covered by the Jest/axios suites.
 */

const DOCS_URL = 'https://green-api.com/docs/api/sending/SendMessage/';

/** Wait up to this long for an element to appear after navigation */
const ELEMENT_TIMEOUT_MS = 15_000;

describe('Selenium smoke: SendMessage documentation page', () => {
  let driver: WebDriver;

  beforeAll(async () => {
    driver = await buildDriver();
  });

  afterAll(async () => {
    await driver.quit();
  });

  // ─── Page load ──────────────────────────────────────────────────────────────

  describe('page availability', () => {
    it('opens the SendMessage docs page without errors', async () => {
      await driver.get(DOCS_URL);

      // Wait for <body> — confirms the page loaded at all
      await driver.wait(until.elementLocated(By.css('body')), ELEMENT_TIMEOUT_MS);

      const currentUrl = await driver.getCurrentUrl();
      expect(currentUrl).toContain('green-api.com');
    });

    it('page title contains "GREEN-API"', async () => {
      const title = await driver.getTitle();
      expect(title.toLowerCase()).toContain('green-api');
    });
  });

  // ─── Method name ────────────────────────────────────────────────────────────

  describe('method name', () => {
    it('page heading contains "sendMessage"', async () => {
      // The main heading (<h1>) should identify the method
      const heading = await driver.wait(
        until.elementLocated(By.css('h1')),
        ELEMENT_TIMEOUT_MS,
      );
      const headingText = await heading.getText();

      expect(headingText.toLowerCase()).toContain('sendmessage');
    });
  });

  // ─── Endpoint URL ────────────────────────────────────────────────────────────

  describe('endpoint URL', () => {
    it('page contains the sendMessage endpoint URL', async () => {
      const bodyText = await driver.findElement(By.css('body')).getText();

      // The docs must show the endpoint URL pattern
      expect(bodyText).toContain('sendMessage');
    });

    it('HTTP method POST is documented', async () => {
      const bodyText = await driver.findElement(By.css('body')).getText();

      expect(bodyText.toUpperCase()).toContain('POST');
    });
  });

  // ─── Request parameters ──────────────────────────────────────────────────────

  describe('request parameters', () => {
    it('parameter "chatId" is documented', async () => {
      const bodyText = await driver.findElement(By.css('body')).getText();

      expect(bodyText).toContain('chatId');
    });

    it('parameter "message" is documented', async () => {
      const bodyText = await driver.findElement(By.css('body')).getText();

      expect(bodyText).toContain('message');
    });
  });

  // ─── Response ────────────────────────────────────────────────────────────────

  describe('response documentation', () => {
    it('"idMessage" field is documented in the response', async () => {
      const bodyText = await driver.findElement(By.css('body')).getText();

      expect(bodyText).toContain('idMessage');
    });
  });

  // ─── Navigation links ────────────────────────────────────────────────────────

  describe('navigation', () => {
    it('page contains a link to the GREEN-API home or docs root', async () => {
      const links = await driver.findElements(By.css('a[href]'));
      const hrefs: string[] = await Promise.all(
        links.map(l => l.getAttribute('href')),
      );

      const hasHomeLink = hrefs.some(
        href => href && href.includes('green-api.com'),
      );
      expect(hasHomeLink).toBe(true);
    });
  });
});
