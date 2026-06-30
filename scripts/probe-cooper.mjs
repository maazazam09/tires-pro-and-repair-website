const res = await fetch("https://www.coopertire.com/tires/discoverer-at3-4s");
const html = await res.text();
const matches = [...html.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|jpg|webp)/gi)].map((m) => m[0]);
const filtered = [...new Set(matches)].filter((u) => /discoverer|at3|cooper|tire/i.test(u));
console.log(filtered.join("\n"));