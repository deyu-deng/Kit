// debug-rss.mjs — pinpoint why parseRSS fields come back empty
const res = await fetch('http://feeds.feedburner.com/giveawayoftheday/feed', {
  headers: { 'user-agent': 'plobikit-bot/1.0' },
});
const xml = await res.text();
console.log('xml length:', xml.length);

const blocks = String(xml || '').match(/<item[\s\S]*?<\/item>/g) || [];
console.log('blocks:', blocks.length);
if (blocks.length) {
  const block = blocks[0];
  console.log('block head:', JSON.stringify(block.slice(0, 120)));
  const re = new RegExp(`<title[^>]*>([\\s\\S]*?)<\\/title>`, 'i');
  console.log('regex source:', re.source);
  const m = block.match(re);
  console.log('title match:', m ? JSON.stringify(m[1].slice(0, 80)) : 'NULL');
}
