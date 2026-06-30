const res = await fetch("https://www.coopertire.com/tires/discoverer-at3-4s");
const html = await res.text();
const matches = [...html.matchAll(/Discoverer_AT3[^"']+\.png/gi)].map((m) => m[0]);
console.log([...new Set(matches)].join("\n"));