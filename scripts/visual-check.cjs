const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const baseUrl = process.env.VISUAL_BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = path.resolve('visual-artifacts');
const viewports = [
  { name: '360', width: 360, height: 800 },
  { name: '390', width: 390, height: 844 },
  { name: '768', width: 768, height: 900 },
  { name: '1280', width: 1280, height: 900 },
  { name: '1440', width: 1440, height: 960 },
];
const routes = [
  '/',
  '/json-formatter',
  '/jwt-decoder',
  '/uuid-generator',
  '/timestamp',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));

  assert(
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `${label}: horizontal overflow (${metrics.scrollWidth}px > ${metrics.clientWidth}px)`,
  );
}

async function validateHomeTrustMessage(page) {
  const localProcessingCount = await page.getByText('Processamento local.', { exact: true }).count();
  assert(localProcessingCount === 1, `Home: expected exactly one local-processing message, found ${localProcessingCount}`);
}

async function validateDesktopSidebar(page) {
  const sidebar = page.getByLabel('Navegação de ferramentas');
  await sidebar.waitFor();
  assert((await sidebar.getAttribute('data-sidebar-state')) === 'expanded', 'Sidebar: expected expanded initial state');

  const expandedWidth = (await sidebar.boundingBox())?.width ?? 0;
  await page.getByRole('button', { name: 'Recolher menu lateral' }).click();
  await page.getByRole('button', { name: 'Expandir menu lateral' }).waitFor();

  assert((await sidebar.getAttribute('data-sidebar-state')) === 'collapsed', 'Sidebar: collapse did not change composition');
  const collapsedWidth = (await sidebar.boundingBox())?.width ?? 0;
  assert(collapsedWidth < expandedWidth, `Sidebar: collapsed width ${collapsedWidth}px is not smaller than ${expandedWidth}px`);
  assert(collapsedWidth >= 64 && collapsedWidth <= 80, `Sidebar: unexpected compact rail width ${collapsedWidth}px`);
  assert((await page.getByRole('link', { name: 'Gerador de CPF' }).count()) === 0, 'Sidebar: tool text remained in compact rail');

  await page.getByRole('button', { name: 'Expandir menu lateral' }).click();
  await page.getByRole('button', { name: 'Recolher menu lateral' }).waitFor();
  assert((await sidebar.getAttribute('data-sidebar-state')) === 'expanded', 'Sidebar: expand did not restore full composition');
  assert((await page.getByRole('link', { name: 'Gerador de CPF' }).count()) === 1, 'Sidebar: tool links did not return after expand');
}

(async () => {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of viewports) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();

      for (const route of routes) {
        const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
        assert(response?.ok(), `${viewport.name} ${route}: HTTP ${response?.status() ?? 'unknown'}`);
        await page.getByRole('heading', { level: 1 }).waitFor();
        await assertNoHorizontalOverflow(page, `${viewport.name} ${route}`);

        if (route === '/') await validateHomeTrustMessage(page);
        if (route === '/' && viewport.width >= 1280) await validateDesktopSidebar(page);

        const routeName = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
        await page.screenshot({
          fullPage: true,
          path: path.join(outputDir, `${viewport.name}-${routeName}.png`),
        });
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  console.log(`Visual validation passed for ${viewports.length} viewports and ${routes.length} routes.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
