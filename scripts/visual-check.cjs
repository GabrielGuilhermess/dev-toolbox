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
const toolRoutes = [
  '/cpf-generator',
  '/cpf-validator',
  '/cnpj-generator',
  '/cnpj-validator',
  '/cpf-cnpj-validator',
  '/json-formatter',
  '/base64',
  '/url-codec',
  '/jwt-decoder',
  '/uuid-generator',
  '/timestamp',
];
const smokeRoutes = ['/', ...toolRoutes];
const screenshotRoutes = ['/', '/json-formatter', '/jwt-decoder', '/uuid-generator', '/timestamp'];
const themes = ['light', 'dark'];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth };
  });
  assert(
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `${label}: horizontal overflow (${metrics.scrollWidth}px > ${metrics.clientWidth}px)`,
  );
}

async function assertSemantics(page, label) {
  assert((await page.getByRole('main').count()) === 1, `${label}: expected exactly one main landmark`);
  assert((await page.getByRole('heading', { level: 1 }).count()) === 1, `${label}: expected exactly one h1`);
}

async function assertTheme(page, theme, label) {
  const state = await page.evaluate(() => ({
    isDark: document.documentElement.classList.contains('dark'),
    stored: localStorage.getItem('dev-toolbox-theme'),
  }));
  assert(state.isDark === (theme === 'dark'), `${label}: root theme class does not match ${theme}`);
  assert(state.stored === theme, `${label}: persisted theme does not match ${theme}`);
}

async function assertKeyboardReachability(page, label) {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return null;
    return { tag: element.tagName, role: element.getAttribute('role'), type: element.getAttribute('type') };
  });
  assert(focused !== null && focused.tag !== 'BODY', `${label}: Tab did not reach an interactive control`);
}

async function assertCriticalTouchTargets(page, viewport, label) {
  if (viewport.width >= 768) return;
  for (const name of ['Abrir menu lateral', 'Alternar para tema escuro']) {
    const control = page.getByRole('button', { name });
    if ((await control.count()) === 0) continue;
    const box = await control.boundingBox();
    assert(box !== null && box.width >= 40 && box.height >= 40, `${label}: ${name} touch target is below 40px`);
  }
}

async function validateHomeTrustMessage(page) {
  const count = await page.getByText('Processamento local.', { exact: true }).count();
  assert(count === 1, `Home: expected exactly one local-processing message, found ${count}`);
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
}

async function validateMobileDrawer(page) {
  await page.getByRole('button', { name: 'Abrir menu lateral' }).click();
  await page.getByRole('button', { name: 'Fechar menu lateral' }).waitFor();
  const sidebar = page.getByLabel('Navegação de ferramentas');
  const box = await sidebar.boundingBox();
  assert(box !== null && box.x >= -1, 'Sidebar: mobile drawer did not enter viewport');
  await page.getByRole('button', { name: 'Fechar menu lateral' }).first().click();
  await page.getByRole('button', { name: 'Abrir menu lateral' }).waitFor();
}

async function validateRoute(page, route, viewport, theme, errors) {
  errors.console.length = 0;
  errors.page.length = 0;
  const label = `${viewport.name} ${theme} ${route}`;
  const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  assert(response?.ok(), `${label}: HTTP ${response?.status() ?? 'unknown'}`);
  await page.getByRole('heading', { level: 1 }).waitFor();
  await assertNoHorizontalOverflow(page, label);
  await assertSemantics(page, label);
  await assertTheme(page, theme, label);
  assert(errors.page.length === 0, `${label}: page error: ${errors.page.join(' | ')}`);
  assert(errors.console.length === 0, `${label}: console error: ${errors.console.join(' | ')}`);

  if (route === '/') {
    await validateHomeTrustMessage(page);
    await assertKeyboardReachability(page, label);
    await assertCriticalTouchTargets(page, viewport, label);
    if (viewport.width >= 1280) await validateDesktopSidebar(page);
    if (viewport.width < 768) await validateMobileDrawer(page);
  }

  if (screenshotRoutes.includes(route)) {
    const routeName = route === '/' ? 'home' : route.slice(1).replaceAll('/', '-');
    await page.screenshot({ fullPage: true, path: path.join(outputDir, `${viewport.name}-${theme}-${routeName}.png`) });
  }
}

(async () => {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });

  try {
    for (const viewport of viewports) {
      for (const theme of themes) {
        const context = await browser.newContext({ viewport, colorScheme: theme, reducedMotion: 'reduce' });
        await context.addInitScript((initialTheme) => {
          localStorage.setItem('dev-toolbox-theme', initialTheme);
        }, theme);
        const page = await context.newPage();
        const errors = { console: [], page: [] };
        page.on('pageerror', (error) => errors.page.push(error.message));
        page.on('console', (message) => {
          if (message.type() === 'error') errors.console.push(message.text());
        });

        for (const route of smokeRoutes) {
          await validateRoute(page, route, viewport, theme, errors);
        }

        errors.console.length = 0;
        errors.page.length = 0;
        const notFoundResponse = await page.goto(`${baseUrl}/__visual-not-found__`, { waitUntil: 'networkidle' });
        assert(notFoundResponse?.ok(), `${viewport.name} ${theme} 404 route: SPA response failed`);
        await page.getByRole('heading', { level: 1, name: 'Página não encontrada' }).waitFor();
        await assertNoHorizontalOverflow(page, `${viewport.name} ${theme} 404`);
        await assertSemantics(page, `${viewport.name} ${theme} 404`);
        assert(errors.page.length === 0, `${viewport.name} ${theme} 404: page error: ${errors.page.join(' | ')}`);
        assert(errors.console.length === 0, `${viewport.name} ${theme} 404: console error: ${errors.console.join(' | ')}`);

        await context.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`Responsive/accessibility validation passed: ${viewports.length} viewports x ${themes.length} themes x ${smokeRoutes.length} routes, plus 404 and ${screenshotRoutes.length * viewports.length * themes.length} screenshots.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
