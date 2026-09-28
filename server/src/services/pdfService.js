const fs = require('fs');

const CANDIDATOS = [
  '/home/lenovot440/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome'
];

let browserPromise = null;

const encontrarChrome = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  for (const ruta of CANDIDATOS) {
    if (ruta && fs.existsSync(ruta)) return ruta;
  }
  return undefined;
};

const obtenerBrowser = async () => {
  if (!browserPromise) {
    let executablePath = encontrarChrome();
    let args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

    const mod = await import('puppeteer-core');
    const puppeteerCore = mod.default || mod;

    if (!executablePath) {
      try {
        const chromiumMod = await import('@sparticuz/chromium');
        const Chromium = chromiumMod.default || chromiumMod;
        executablePath = await Chromium.executablePath();
        const cromiumArgs = Chromium.args || [];
        if (cromiumArgs.length) args = cromiumArgs;
      } catch (e) {
        console.warn('No se pudo cargar @sparticuz/chromium:', e.message);
      }
    }

    browserPromise = puppeteerCore.launch({
      headless: true,
      executablePath,
      args
    });
    browserPromise.catch(() => { browserPromise = null; });
  }
  return browserPromise;
};

/**
 * Renderiza un PDF A4 desde HTML.
 * @param {string} html
 * @returns {Promise<Buffer>}
 */
const renderPdf = async (html) => {
  const browser = await obtenerBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    return Buffer.from(await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
    }));
  } finally {
    await page.close();
  }
};

module.exports = { renderPdf };