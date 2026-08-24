
const sharp = require("sharp");
const fs = require("fs");
const [photo, svg, sortie] = process.argv.slice(2);
(async () => {
  /* Le plateau, le ring et les drapeaux sont dans la moitie BASSE des photos ;
     la moitie haute est de la charpente. `attention` choisissait le toit (plus
     de contraste) et la carte vendait une tole. On prend une bande centree a
     58 % : sous le milieu, la ou l action se passe. */
  const src = sharp(photo);
  const meta = await src.metadata();
  const hVoulue = Math.round(meta.width / (1200 / 630));
  const top = Math.max(0, Math.min(meta.height - hVoulue, Math.round((meta.height - hVoulue) * 0.58)));
  const fond = await sharp(photo)
    .extract({ left: 0, top, width: meta.width, height: Math.min(hVoulue, meta.height) })
    .resize(1200, 630, { fit: "cover" })
    .modulate({ brightness: 1.04, saturation: 1.02 })
    .linear(1.03, -3)
    .toBuffer();
  await sharp(fond)
    .composite([{ input: fs.readFileSync(svg), top: 0, left: 0 }])
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(sortie);
  const m = await sharp(sortie).metadata();
  const st = await sharp(sortie).stats();
  const c = st.channels.slice(0, 3).map((x) => Math.round(x.mean));
  console.log(`${m.width}x${m.height} ${Math.round(fs.statSync(sortie).size / 1024)}ko RGB:${c.join("/")} ecart:${Math.abs(c[0] - c[2])}`);
})();
