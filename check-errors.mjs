import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.toString()));
    
    console.log('Navigating to http://localhost:8080/search ...');
    await page.goto('http://localhost:8080/search', { waitUntil: 'networkidle0', timeout: 30000 });
    
    console.log('Page loaded successfully. Waiting a bit...');
    await new Promise(r => setTimeout(r, 2000));
    
    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('Puppeteer Script Error:', err);
    process.exit(1);
  }
})();
