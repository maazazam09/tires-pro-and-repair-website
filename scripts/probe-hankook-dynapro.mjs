const urls = [
  "https://asset.hankooktire.com/content/dam/hankooktire/local/product/dynapro-at2-rf11/dynapro-at2-rf11.png",
  "https://asset.hankooktire.com/content/dam/hankooktire/local/product/dynapro-at2-rf11/product.png",
  "https://asset.hankooktire.com/content/dam/hankooktire/local/product/dynapro-at2-rf11/front.png",
  "https://asset.hankooktire.com/content/dam/hankooktire/local/product/dynapro-at2-rf11/image.png",
  "https://asset.hankooktire.com/content/dam/hankooktire/local/product/dynapro-at2-rf11/dynapro-at2-rf11-front.png",
  "https://asset.hankooktire.com/content/dam/hankooktire/local/product/kinergy-pt-h737/kinergy-pt-h737.png",
];

for (const url of urls) {
  const res = await fetch(url);
  console.log(res.status, res.headers.get("content-type"), url);
}