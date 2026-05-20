const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Fetching auth token from backend...');
  const res = await fetch('http://localhost:8000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'pemilik', password: 'admin1234' })
  });
  
  if (!res.ok) {
    throw new Error(`Failed to login: ${res.statusText}`);
  }
  
  const data = await res.json();
  console.log('Login successful! Token:', data.access_token);
  
  const authData = {
    user: data.user,
    token: data.access_token
  };
  
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`PAGE LOG [${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log(`REQUEST FAILED: ${req.url()} - ${req.failure()?.errorText || 'Unknown error'}`));
  page.on('request', req => {
    console.log(`REQUEST: ${req.method()} ${req.url()}`);
  });
  page.on('response', resp => {
    console.log(`RESPONSE: ${resp.status()} ${resp.url()}`);
  });
  
  await page.setViewportSize({ width: 1440, height: 900 });
  
  console.log('Navigating to login page to set origin...');
  await page.goto('http://localhost:5173/login');
  
  console.log('Setting localStorage auth data...');
  await page.evaluate((authStr) => {
    localStorage.setItem('isp_auth', authStr);
  }, JSON.stringify(authData));
  
  console.log('Navigating directly to Network Monitoring (NOC)...');
  await page.goto('http://localhost:5173/network');
  
  console.log('Waiting for Network Operation Center title...');
  await page.waitForSelector('text=Network Operation Center', { timeout: 15000 });
  
  console.log('Waiting for loading screen to disappear...');
  try {
    await page.waitForSelector('text=Mengambil data dari Router...', { state: 'hidden', timeout: 30000 });
    console.log('Loading screen disappeared successfully.');
  } catch (err) {
    console.log('Timeout waiting for loading screen to disappear, continuing anyway.');
  }
  
  // Extra wait to let animations settle
  await page.waitForTimeout(2000);
  
  // -- Tab 1: Traffic & Performa --
  const pathTraffic = 'C:\\Users\\ramar\\.gemini\\antigravity\\brain\\842f20b8-c89f-4045-ade8-0151bef62d47\\noc_traffic_performance.png';
  console.log(`Taking traffic/performa screenshot: ${pathTraffic}`);
  await page.screenshot({ path: pathTraffic, fullPage: true });
  
  // -- Tab 2: Manajemen Perangkat --
  console.log('Switching to Manajemen Perangkat tab...');
  await page.click('text=Manajemen Perangkat');
  await page.waitForTimeout(2000);
  const pathDevices = 'C:\\Users\\ramar\\.gemini\\antigravity\\brain\\842f20b8-c89f-4045-ade8-0151bef62d47\\noc_manajemen_perangkat.png';
  console.log(`Taking device management screenshot: ${pathDevices}`);
  await page.screenshot({ path: pathDevices, fullPage: true });
  
  // -- Tab 3: Alarm & Insiden --
  console.log('Switching to Alarm & Insiden tab...');
  await page.click('text=Alarm & Insiden');
  await page.waitForTimeout(2000);
  const pathAlarms = 'C:\\Users\\ramar\\.gemini\\antigravity\\brain\\842f20b8-c89f-4045-ade8-0151bef62d47\\noc_alarm_insiden.png';
  console.log(`Taking alarm/insiden screenshot: ${pathAlarms}`);
  await page.screenshot({ path: pathAlarms, fullPage: true });
  
  // -- Map Topology --
  console.log('Navigating to Network Map topology...');
  await page.goto('http://localhost:5173/map');
  console.log('Waiting for Map elements...');
  await page.waitForTimeout(6000);
  const mapScreenshotPath = 'C:\\Users\\ramar\\.gemini\\antigravity\\brain\\842f20b8-c89f-4045-ade8-0151bef62d47\\map_screenshot.png';
  console.log(`Taking map screenshot: ${mapScreenshotPath}`);
  await page.screenshot({ path: mapScreenshotPath, fullPage: true });
  
  await browser.close();
  console.log('Done!');
})().catch(err => {
  console.error('Error occurred:', err);
  process.exit(1);
});
