const res = await fetch("https://www.nittotire.com/light-truck-tires/ridge-grappler-light-truck-tire/");
const html = await res.text();
const matches = [...html.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|jpg|webp)/gi)].map((m) => m[0]);
console.log([...new Set(matches)].join("\n"));