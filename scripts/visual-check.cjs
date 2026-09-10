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
  '/cpf-generator', '/cpf-validator', '/cnpj-generator', '/cnpj-validator',
  '/cpf-cnpj-validator', '/json-formatter', '/base64', '/url-codec',
  '/jwt-decoder', '/uuid-generator', '/timestamp',
];
const smokeRoutes = ['/', ...toolRoutes];
const screenshotRoutes = ['/', '/json-formatter', '/jwt-decoder', '/uuid-generator', '/timestamp'];
const themes = ['light', 'dark'];
const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function assertNoHorizontalOverflow(page, label) {
  const metrics = await page.evaluate(() => {
    const root = globalThis.document.documentElement;
    return { clientWidth: root.clientWidth, scrollWidth: root.scrollWidth };
  });
  assert(metrics.scrollWidth <= metrics.clientWidth + 1, `${label}: horizontal overflow (${metrics.scrollWidth}px > ${metrics.clientWidth}px)`);
}

async function assertSemantics(page, label) {
  assert((await page.getByRole('main').count()) === 1, `${label}: expected exactly one main landmark`);
  assert((await page.getByRole('heading', { level: 1 }).count()) === 1, `${label}: expected exactly one h1`);
}

async function assertTheme(page, theme, label) {
  const state = await page.evaluate(() => ({
    isDark: globalThis.document.documentElement.classList.contains('dark'),
    stored: globalThis.localStorage.getItem('dev-toolbox-theme'),
  }));
  assert(state.isDark === (theme === 'dark'), `${label}: root theme class does not match ${theme}`);
  assert(state.stored === theme, `${label}: persisted theme does not match ${theme}`);
}

async function assertKeyboardAndVisibleFocus(page, label) {
  const expected = await page.locator(focusableSelector).evaluateAll((elements) => elements.filter((element) => {
    const style = globalThis.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  }).length);
  assert(expected > 0, `${label}: no visible keyboard controls found`);

  await page.locator('body').click({ position: { x: 1, y: 1 } });
  const reached = new Set();
  const missingFocusIndicators = new Map();
  for (let index = 0; index < expected + 8; index += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate((selector) => {
      const element = globalThis.document.activeElement;
      if (!(element instanceof globalThis.HTMLElement) || !element.matches(selector)) return null;
      const candidates = Array.from(globalThis.document.querySelectorAll(selector)).filter((candidate) => {
        const style = globalThis.getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      });
      const style = globalThis.getComputedStyle(element);
      const outlineVisible = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
      const shadowVisible = style.boxShadow !== 'none';
      return {
        index: candidates.indexOf(element),
        descriptor: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40) || element.tagName,
        focusVisible: element.matches(':focus-visible'),
        indicatorVisible: outlineVisible || shadowVisible,
      };
    }, focusableSelector);
    if (!state || state.index < 0) continue;
    reached.add(state.index);
    if (!(state.focusVisible && state.indicatorVisible)) {
      missingFocusIndicators.set(state.index, state.descriptor);
    }
    if (reached.size === expected) break;
  }
  assert(reached.size === expected, `${label}: keyboard reached ${reached.size}/${expected} visible controls`);
  assert(
    missingFocusIndicators.size === 0,
    `${label}: ${missingFocusIndicators.size} keyboard-reached control(s) lack visible focus (${Array.from(missingFocusIndicators.values()).join(', ')})`,
  );
}

async function assertContrast(page, label) {
  const failures = await page.evaluate(() => {
    const parse = (value) => {
      const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return match ? match.slice(1, 4).map(Number) : null;
    };
    const luminance = (rgb) => {
      const values = rgb.map((value) => {
        const channel = value / 255;
        return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
    };
    const ratio = (foreground, background) => {
      const a = luminance(foreground);
      const b = luminance(background);
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    };
    const backgroundOf = (element) => {
      let current = element;
      while (current) {
        const style = globalThis.getComputedStyle(current);
        const parsed = parse(style.backgroundColor);
        if (parsed && style.backgroundColor !== 'rgba(0, 0, 0, 0)') return parsed;
        current = current.parentElement;
      }
      return [255, 255, 255];
    };
    return Array.from(globalThis.document.querySelectorAll('main h1, main button, main a, main label')).flatMap((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return [];
      const style = globalThis.getComputedStyle(element);
      const foreground = parse(style.color);
      const background = backgroundOf(element);
      if (!foreground) return [];
      const value = ratio(foreground, background);
      const visibleText = (element.textContent || '').trim();
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
      const largeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const minimum = visibleText ? (largeText ? 3 : 4.5) : 3;
      return value < minimum
        ? [`${element.tagName}:${(visibleText || element.getAttribute('aria-label') || '').slice(0, 40)}=${value.toFixed(2)}<${minimum}`]
        : [];
    });
  });
  assert(failures.length === 0, `${label}: insufficient contrast (${failures.join(', ')})`);
}

async function assertReducedMotion(page, label) {
  const state = await page.evaluate(() => {
    const mediaMatches = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const offenders = Array.from(globalThis.document.querySelectorAll('*')).flatMap((element) => {
      const style = globalThis.getComputedStyle(element);
      const parseDurations = (value) => value.split(',').map((part) => part.trim()).map((part) => part.endsWith('ms') ? Number.parseFloat(part) : Number.parseFloat(part) * 1000);
      const animation = Math.max(...parseDurations(style.animationDuration), 0);
      const transition = Math.max(...parseDurations(style.transitionDuration), 0);
      if (animation <= 100 && transition <= 100) return [];
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return [];
      return [`${element.tagName}.${element.className || ''}:${Math.max(animation, transition)}ms`];
    });
    return { mediaMatches, offenders: offenders.slice(0, 10) };
  });
  assert(state.mediaMatches, `${label}: reduced-motion media query is not active`);
  assert(state.offenders.length === 0, `${label}: reduced motion leaves long animation/transition (${state.offenders.join(', ')})`);
}

async function assertCriticalTouchTargets(page, viewport, label) {
  if (viewport.width >= 768) return;
  const controls = [page.getByRole('button', { name: 'Abrir menu lateral' }), page.getByRole('button', { name: /Alternar para tema (claro|escuro)/ })];
  for (const control of controls) {
    const box = await control.boundingBox();
    assert(box !== null && box.width >= 40 && box.height >= 40, `${label}: critical touch target is below 40px`);
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
  await page.getByRole('button', { name: 'Expandir menu lateral' }).click();
  await page.getByRole('button', { name: 'Recolher menu lateral' }).waitFor();
}

async function validateMobileDrawer(page, label) {
  await page.locator('body').click({ position: { x: 1, y: 1 } });
  let openerReached = false;
  for (let index = 0; index < 12; index += 1) {
    await page.keyboard.press('Tab');
    openerReached = await page.evaluate(() => globalThis.document.activeElement?.getAttribute('aria-label') === 'Abrir menu lateral');
    if (openerReached) break;
  }
  assert(openerReached, `${label}: mobile drawer opener is not keyboard-reachable`);
  await page.keyboard.press('Enter');

  const overlay = page.getByRole('button', { name: 'Fechar menu lateral' }).first();
  await overlay.waitFor();
  const sidebar = page.getByLabel('Navegação de ferramentas');
  await page.waitForFunction(() => {
    const element = globalThis.document.querySelector('aside[aria-label="Navegação de ferramentas"]');
    return element !== null && element.getBoundingClientRect().x >= -1;
  });
  const box = await sidebar.boundingBox();
  assert(box !== null && box.x >= -1, `${label}: mobile drawer did not enter viewport`);

  const expectedDrawerControls = await sidebar.locator(focusableSelector).evaluateAll((elements) => elements.filter((element) => {
    const style = globalThis.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  }).length);
  assert(expectedDrawerControls > 0, `${label}: mobile drawer has no visible keyboard controls`);

  const reached = new Set();
  const missingFocusIndicators = new Map();
  for (let index = 0; index < expectedDrawerControls + 12; index += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate((selector) => {
      const sidebarElement = globalThis.document.querySelector('aside[aria-label="Navegação de ferramentas"]');
      const element = globalThis.document.activeElement;
      if (!(sidebarElement instanceof globalThis.HTMLElement) || !(element instanceof globalThis.HTMLElement) || !sidebarElement.contains(element) || !element.matches(selector)) return null;
      const candidates = Array.from(sidebarElement.querySelectorAll(selector)).filter((candidate) => {
        const style = globalThis.getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      });
      const style = globalThis.getComputedStyle(element);
      const outlineVisible = style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) > 0;
      const shadowVisible = style.boxShadow !== 'none';
      return {
        index: candidates.indexOf(element),
        descriptor: element.getAttribute('aria-label') || element.textContent?.trim().slice(0, 40) || element.tagName,
        focusVisible: element.matches(':focus-visible'),
        indicatorVisible: outlineVisible || shadowVisible,
      };
    }, focusableSelector);
    if (!state || state.index < 0) continue;
    reached.add(state.index);
    if (!(state.focusVisible && state.indicatorVisible)) missingFocusIndicators.set(state.index, state.descriptor);
    if (reached.size === expectedDrawerControls) break;
  }
  assert(reached.size === expectedDrawerControls, `${label}: keyboard reached ${reached.size}/${expectedDrawerControls} mobile drawer controls`);
  assert(
    missingFocusIndicators.size === 0,
    `${label}: mobile drawer controls lack visible focus (${Array.from(missingFocusIndicators.values()).join(', ')})`,
  );

  const overlayBox = await overlay.boundingBox();
  assert(overlayBox !== null, `${label}: mobile overlay has no bounding box`);
  await overlay.click({ position: { x: overlayBox.width - 20, y: 20 } });
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
  await assertKeyboardAndVisibleFocus(page, label);
  await assertContrast(page, label);
  await assertReducedMotion(page, label);
  assert(errors.page.length === 0, `${label}: page error: ${errors.page.join(' | ')}`);
  assert(errors.console.length === 0, `${label}: console error: ${errors.console.join(' | ')}`);

  if (route === '/') {
    await validateHomeTrustMessage(page);
    await assertCriticalTouchTargets(page, viewport, label);
    if (viewport.width >= 1280) await validateDesktopSidebar(page);
    if (viewport.width < 768) await validateMobileDrawer(page, label);
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
        await context.addInitScript((initialTheme) => globalThis.localStorage.setItem('dev-toolbox-theme', initialTheme), theme);
        const page = await context.newPage();
        const errors = { console: [], page: [] };
        page.on('pageerror', (error) => errors.page.push(error.message));
        page.on('console', (message) => { if (message.type() === 'error') errors.console.push(message.text()); });
        for (const route of smokeRoutes) await validateRoute(page, route, viewport, theme, errors);

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
  console.log(`Responsive/accessibility validation passed: ${viewports.length} viewports x ${themes.length} themes x ${smokeRoutes.length} routes, with per-control keyboard/focus, WCAG text contrast, reduced-motion and mobile-drawer keyboard checks plus ${screenshotRoutes.length * viewports.length * themes.length} screenshots.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
