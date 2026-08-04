const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
  const pg = await b.newPage();
  const url = "file://" + path.join(__dirname, "index.html");
  await pg.goto(url, { waitUntil: "networkidle" });
  await pg.emulateMedia({ media: "print" });
  await pg.pdf({
    path: path.join(__dirname, "Kordy_Brochure_print.pdf"),
    width: "210mm", height: "220mm",
    printBackground: true, preferCSSPageSize: true,
  });
  // QA screenshots of each sheet (screen media, high DPR)
  await pg.emulateMedia({ media: "screen" });
  const sheets = await pg.$$(".sheet");
  for (let i = 0; i < sheets.length; i++) {
    await sheets[i].screenshot({ path: path.join(__dirname, `qa-web${i + 1}.png`) });
  }
  console.log("pdf + qa written");
  await b.close();
})();
