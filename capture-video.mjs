import { chromium } from 'playwright';
import { execSync } from 'child_process';
import { mkdirSync, existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const FFMPEG = '/tmp/ffmpeg-bin/ffmpeg';
const BASE_URL = 'http://localhost:8000';
const FRAMES_DIR = '/tmp/politika-frames';
const OUTPUT = join(process.cwd(), 'politika-demo.mp4');
const VIEWPORT = { width: 1920, height: 1080 };
const FPS = 4;
const SCROLL_STEPS = 8;

// Credentials
const EMAIL = 'diegomachad@gmail.com';
const PASSWORD = 'machado';

// Clean/create frames dir
if (existsSync(FRAMES_DIR)) execSync(`rm -rf ${FRAMES_DIR}`);
mkdirSync(FRAMES_DIR, { recursive: true });

let frameNum = 0;
function framePath() {
  return join(FRAMES_DIR, `frame_${String(frameNum++).padStart(5, '0')}.png`);
}

async function hold(page, seconds) {
  const count = Math.round(seconds * FPS);
  for (let i = 0; i < count; i++) {
    await page.screenshot({ path: framePath(), fullPage: false });
  }
}

async function smoothScroll(page, targetY, steps) {
  const currentY = await page.evaluate(() => window.scrollY);
  const delta = (targetY - currentY) / steps;
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(currentY + delta * i));
    await page.waitForTimeout(30);
    await page.screenshot({ path: framePath(), fullPage: false });
  }
}

async function scrollToBottom(page) {
  const max = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  const current = await page.evaluate(() => window.scrollY);
  if (max - current > 200) {
    const steps = Math.min(Math.ceil((max - current) / 150), 20);
    await smoothScroll(page, max, steps);
  }
}

async function scrollToTop(page) {
  const current = await page.evaluate(() => window.scrollY);
  if (current > 100) {
    await smoothScroll(page, 0, 6);
  }
}

// Generate a branded intro/outro frame as an HTML page
function generateBrandedHTML(text, subtitle) {
  return `<!DOCTYPE html>
<html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px; height: 1080px;
    background: #0a0e17;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    color: #f1f5f9;
  }
  .logo { font-size: 96px; font-weight: 700; letter-spacing: -2px; }
  .blue { color: #3b8bff; }
  .subtitle { font-size: 32px; color: #94a3b8; margin-top: 16px; }
  .line { width: 80px; height: 4px; background: #136dec; border-radius: 4px; margin: 32px 0; }
  .small { font-size: 20px; color: #64748b; margin-top: 8px; }
</style></head><body>
  <div class="logo">Polit<span class="blue">ika</span></div>
  <div class="line"></div>
  <div class="subtitle">${text}</div>
  <div class="small">${subtitle}</div>
</body></html>`;
}

function generateSectionHTML(title, icon) {
  return `<!DOCTYPE html>
<html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1920px; height: 1080px;
    background: #0a0e17;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    color: #f1f5f9;
  }
  .icon { font-size: 64px; margin-bottom: 24px; }
  .title { font-size: 56px; font-weight: 700; }
  .brand { font-size: 18px; color: #3b8bff; position: absolute; bottom: 40px; right: 60px; font-weight: 600; letter-spacing: 1px; }
</style></head><body>
  <div class="icon">${icon}</div>
  <div class="title">${title}</div>
  <div class="brand">POLITIKA</div>
</body></html>`;
}

async function captureBrandedSlide(context, html, seconds) {
  const slidePage = await context.newPage();
  await slidePage.setContent(html, { waitUntil: 'networkidle' });
  await slidePage.waitForTimeout(500);
  const count = Math.round(seconds * FPS);
  for (let i = 0; i < count; i++) {
    await slidePage.screenshot({ path: framePath(), fullPage: false });
  }
  await slidePage.close();
}

async function main() {
  console.log('🎬 Iniciando captura do Politika...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: 'dark',
    locale: 'pt-BR',
  });

  const page = await context.newPage();

  // ═══════════════════════════════════════
  // INTRO - Branded slide
  // ═══════════════════════════════════════
  console.log('🎨 Intro: Branding');
  await captureBrandedSlide(context,
    generateBrandedHTML('Inteligência Política Estratégica', 'Plataforma de IA Generativa para Campanhas'),
    3
  );

  // ═══════════════════════════════════════
  // CENA 1: Landing Page completa
  // ═══════════════════════════════════════
  console.log('📸 Cena 1: Landing Page');
  await captureBrandedSlide(context, generateSectionHTML('Landing Page', '🌐'), 2);

  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  await hold(page, 3);
  await smoothScroll(page, 700, SCROLL_STEPS);
  await hold(page, 2);
  await smoothScroll(page, 1400, SCROLL_STEPS);
  await hold(page, 2);
  await smoothScroll(page, 2100, SCROLL_STEPS);
  await hold(page, 2);
  const landingMax = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  await smoothScroll(page, landingMax, SCROLL_STEPS);
  await hold(page, 2);

  // ═══════════════════════════════════════
  // CENA 2: Login
  // ═══════════════════════════════════════
  console.log('📸 Cena 2: Login');
  await captureBrandedSlide(context, generateSectionHTML('Acesso Seguro', '🔐'), 2);

  await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1500);
  await hold(page, 2);

  // Type email
  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
  await emailInput.click();
  await emailInput.fill('');
  await emailInput.type(EMAIL, { delay: 40 });
  await hold(page, 0.5);

  // Type password
  const passInput = page.locator('input[type="password"]').first();
  await passInput.click();
  await passInput.type(PASSWORD, { delay: 40 });
  await hold(page, 0.5);

  // Click login button
  const loginBtn = page.locator('button[type="submit"]').first();
  await loginBtn.click();
  await hold(page, 1);

  // Wait for navigation
  await page.waitForTimeout(4000);
  await hold(page, 3);

  // ═══════════════════════════════════════
  // CENA 3: Command Center
  // ═══════════════════════════════════════
  console.log('📸 Cena 3: Command Center');
  await captureBrandedSlide(context, generateSectionHTML('Command Center', '📡'), 2);

  await page.goto(`${BASE_URL}/#/dashboard`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await hold(page, 3);
  await scrollToBottom(page);
  await hold(page, 2);
  await scrollToTop(page);

  // ═══════════════════════════════════════
  // CENA 4: Analise Estrategica
  // ═══════════════════════════════════════
  console.log('📸 Cena 4: Dashboard de Análise');
  await captureBrandedSlide(context, generateSectionHTML('Análise Estratégica', '⚔️'), 2);

  await page.goto(`${BASE_URL}/#/analyze`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await hold(page, 3);
  await scrollToBottom(page);
  await hold(page, 2);
  await scrollToTop(page);

  // ═══════════════════════════════════════
  // CENA 5: War Room
  // ═══════════════════════════════════════
  console.log('📸 Cena 5: War Room');
  await captureBrandedSlide(context, generateSectionHTML('War Room', '🚨'), 2);

  await page.goto(`${BASE_URL}/#/crisis`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await hold(page, 3);
  await scrollToBottom(page);
  await hold(page, 2);
  await scrollToTop(page);

  // ═══════════════════════════════════════
  // CENA 6: Pulse Monitor
  // ═══════════════════════════════════════
  console.log('📸 Cena 6: Pulse Monitor');
  await captureBrandedSlide(context, generateSectionHTML('Pulse Monitor', '📊'), 2);

  await page.goto(`${BASE_URL}/#/pulse`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(3000);
  await hold(page, 3);
  await scrollToBottom(page);
  await hold(page, 2);
  await scrollToTop(page);

  // ═══════════════════════════════════════
  // CENA 7: Historico
  // ═══════════════════════════════════════
  console.log('📸 Cena 7: Histórico');
  await captureBrandedSlide(context, generateSectionHTML('Memória de Guerra', '📜'), 2);

  await page.goto(`${BASE_URL}/#/history`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await hold(page, 3);
  await scrollToBottom(page);
  await hold(page, 2);

  // ═══════════════════════════════════════
  // CENA 8: Workspaces
  // ═══════════════════════════════════════
  console.log('📸 Cena 8: Workspaces');
  await captureBrandedSlide(context, generateSectionHTML('Multi-Campanha', '🗂️'), 2);

  await page.goto(`${BASE_URL}/#/workspaces`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(2000);
  await hold(page, 3);
  await scrollToBottom(page);
  await hold(page, 2);

  // ═══════════════════════════════════════
  // OUTRO - Branded slide
  // ═══════════════════════════════════════
  console.log('🎨 Outro: Encerramento');
  await captureBrandedSlide(context,
    generateBrandedHTML('Domine a Narrativa.', 'iapolitika.com.br'),
    4
  );

  await browser.close();

  // ═══════════════════════════════════════
  // Montar video com ffmpeg + watermark
  // ═══════════════════════════════════════
  const totalFrames = readdirSync(FRAMES_DIR).filter(f => f.endsWith('.png')).length;
  console.log(`\n🎞️  Total de frames: ${totalFrames}`);
  console.log('🔧 Montando video com branding...');

  // ffmpeg com watermark "POLITIKA" no canto inferior direito
  const cmd = [
    FFMPEG, '-y',
    '-framerate', String(FPS),
    '-i', join(FRAMES_DIR, 'frame_%05d.png'),
    '-vf', [
      'format=yuv420p',
      'scale=1920:1080',
      `drawtext=text='POLITIKA':fontsize=24:fontcolor=white@0.4:x=w-tw-40:y=h-th-30:font=Helvetica`
    ].join(','),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-movflags', '+faststart',
    OUTPUT
  ].join(' ');

  execSync(cmd, { stdio: 'inherit' });

  // Duracao
  const duration = totalFrames / FPS;
  console.log(`\n✅ Video criado: ${OUTPUT}`);
  console.log(`⏱️  Duração: ${Math.floor(duration / 60)}:${String(Math.round(duration % 60)).padStart(2, '0')}`);
  console.log(`📐 Resolução: 1920x1080`);

  // Cleanup
  execSync(`rm -rf ${FRAMES_DIR}`);
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
