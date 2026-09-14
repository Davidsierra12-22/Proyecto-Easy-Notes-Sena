const fs = require('fs');

let puppeteer = null;
let browserPromise = null;

const CANDIDATOS = [
  '/home/lenovot440/.cache/puppeteer/chrome/linux-149.0.7827.22/chrome-linux64/chrome'
];

const obtenerPuppeteer = () => {
  if (!puppeteer) {
    puppeteer = require('puppeteer');
  }
  return puppeteer;
};

const encontrarChrome = () => {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  for (const ruta of CANDIDATOS) {
    if (ruta && fs.existsSync(ruta)) return ruta;
  }
  return undefined;
};

const obtenerBrowser = async () => {
  if (!browserPromise) {
    browserPromise = obtenerPuppeteer().launch({
      headless: true,
      executablePath: encontrarChrome(),
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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