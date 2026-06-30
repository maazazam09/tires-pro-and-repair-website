const res = await fetch("https://www.hankooktire.com/us/en/tirelist/vehicle/light-truck.html", {
  headers: { "User-Agent": "Mozilla/5.0" },
});
const html = await res.text();
const matches = [...html.matchAll(/https?:\/\/[^"'\s>]+\.(?:png|jpg|webp)/gi)].map((m) => m[0]);
const dynapro = [...new Set(matches)].filter((u) => /dynapro|kinergy|ventus|product|tire/i.test(u));
console.log(dynapro.join("\n"));