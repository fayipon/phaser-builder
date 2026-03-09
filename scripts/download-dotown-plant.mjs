import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, '../public/assets/dotown/plant');
fs.mkdirSync(OUT_DIR, { recursive: true });

const IDS = [
  3535, 3532, 3528, 3525, 3274, 3272, 1221, 2479, 2476, 2473,
  2255, 2252, 2249, 2246, 2243, 2240, 1428, 1422, 1416, 1407,
  1399, 1391, 1378, 1368, 1362, 1353, 1346, 1338, 1330, 1318,
  1310, 1301, 1292, 1289, 1284, 1278, 1271, 1262, 1258, 1254,
  1249, 1246, 1243, 1239, 1236, 1233, 1230, 1227, 1224,
];

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return get(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
    req.on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', (e) => { fs.unlink(dest, () => {}); reject(e); });
  });
}

async function main() {
  for (const id of IDS) {
    const pageUrl = `https://dotown.maeda-design-room.net/${id}/`;
    try {
      const html = await get(pageUrl);
      // Use og:image meta tag which reliably contains the main illustration URL
      const m = html.match(/<meta property="og:image" content="(https:\/\/dotown\.maeda-design-room\.net\/wp-content\/uploads\/[^"]+\.png)"/);
      if (!m) {
        console.log(`MISS ${id}`);
        continue;
      }
      const pngUrl = m[1];
      const fileName = path.basename(pngUrl);
      const dest = path.join(OUT_DIR, fileName);
      await download(pngUrl, dest);
      console.log(`OK  ${fileName}  [${id}]`);
    } catch (e) {
      console.log(`ERR ${id}: ${e.message}`);
    }
  }
  console.log('\nDone!');
}

main();
