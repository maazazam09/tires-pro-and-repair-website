const pages = [
  ["hankook", "https://www.hankooktire.com/us/en/tirelist/vehicle/light-truck.html"],
  ["cooper", "https://www.coopertire.com/tires/discoverer-at3-4s"],
  ["bridgestone", "https://tires.bridgestone.com/en-us/automotive/tire-brand/dueler"],
  ["falken", "https://www.falkentire.com/tire/wildpeak-at3w"],
  ["firestone", "https://www.firestonetire.com/tires/destination-le3"],
  ["general", "https://www.generaltire.com/tires/grabber-atx"],
  ["federal", "https://www.federaltire.com/products/couragia-m-t"],
  ["sailun", "https://www.sailuntire.com/na/products/atr"],
  ["gtradial", "https://www.gtradial-usa.com/tires/champiro-ux1"],
];

for (const [brand, url] of pages) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    const html = await res.text();
    const matches = [...html.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|jpg|webp)/gi)].map((m) => m[0]);
    const tireish = [...new Set(matches)].filter((u) => /tire|product|grabber|wildpeak|dueler|destination|dynapro|federal|sailun|champiro|discoverer/i.test(u));
    console.log(`\n=== ${brand} (${res.status}) ===`);
    console.log(tireish.slice(0, 8).join("\n") || "(none)");
  } catch (error) {
    console.log(`\n=== ${brand} ERROR ===`, error.message);
  }
}