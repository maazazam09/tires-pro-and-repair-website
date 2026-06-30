const res = await fetch("https://tires.bridgestone.com/en-us/automotive/tire-brand/dueler", {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const html = await res.text();
const matches = [...html.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|jpg|webp)/gi)].map((m) => m[0]);
console.log([...new Set(matches)].filter((u) => /scene7|dueler|tire|bridgestone/i.test(u)).join("\n"));