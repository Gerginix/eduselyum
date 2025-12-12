/* =========================
   FREYA — YKS Puan + Sıralama (CSV)
   Repo kökünde bu dosyalar olmalı:
   /say.csv  /ea.csv  /soz.csv  /dil.csv
   ========================= */

function readNumber(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = (el.value ?? "").toString().trim();
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}
function round3(x) { return Math.round(x * 1000) / 1000; }

/* ====== Katsayılar (Excel: Katsayılar_2025 sheet) ====== */
const COEF = {
  EA:  { intercept:128.028, obp:0.60285, TR:1.16424, SB:1.33609, TM:1.44715, FB:1.02141,
         AYT_MAT:2.88393, FIZ:0, KIM:0, BIO:0, EDEB:2.97424, TAR1:2.39932, COG1:2.85842,
         TAR2:0, COG2:0, FELS:0, DKAB:0, YDIL:0 },
  SAY: { intercept:131.024, obp:0.62029, TR:1.18697, SB:1.30313, TM:1.40198, FB:1.05742,
         AYT_MAT:2.87473, FIZ:2.4126, KIM:2.57134, BIO:2.60486, EDEB:0, TAR1:0, COG1:0,
         TAR2:0, COG2:0, FELS:0, DKAB:0, YDIL:0 },
  SOZ: { intercept:127.213, obp:0.60938, TR:1.09611, SB:1.14037, TM:1.32458, FB:0.98354,
         AYT_MAT:0, FIZ:0, KIM:0, BIO:0, EDEB:2.86968, TAR1:2.49727, COG1:2.70539,
         TAR2:3.74723, COG2:2.53476, FELS:3.70284, DKAB:2.55278, YDIL:0 },
  DIL: { intercept:106.259, obp:0.57305, TR:1.42611, SB:1.86721, TM:1.92707, FB:1.33508,
         AYT_MAT:0, FIZ:0, KIM:0, BIO:0, EDEB:0, TAR1:0, COG1:0,
         TAR2:0, COG2:0, FELS:0, DKAB:0, YDIL:2.60491 },
};

function calcScore(tur, x) {
  const c = COEF[tur];
  const p =
    c.intercept +
    c.obp * x.obp +
    c.TR * x.tyt_tr +
    c.SB * x.tyt_sos +
    c.TM * x.tyt_mat +
    c.FB * x.tyt_fen +
    c.AYT_MAT * x.ayt_mat +
    c.FIZ * x.ayt_fiz +
    c.KIM * x.ayt_kim +
    c.BIO * x.ayt_bio +
    c.EDEB * x.ayt_edeb +
    c.TAR1 * x.ayt_tar1 +
    c.COG1 * x.ayt_cog1 +
    c.TAR2 * x.ayt_tar2 +
    c.COG2 * x.ayt_cog2 +
    c.FELS * x.ayt_fels +
    c.DKAB * x.ayt_dkab +
    c.YDIL * x.ydt;

  return round3(p);
}

/* ====== Görünürlük ====== */
function showOnlyGroup(tur) {
  const gSay = document.getElementById("grp_say");
  const gEa  = document.getElementById("grp_ea");
  const gSoz = document.getElementById("grp_soz");
  const gDil = document.getElementById("grp_dil");
  if (gSay) gSay.style.display = (tur === "SAY") ? "" : "none";
  if (gEa)  gEa.style.display  = (tur === "EA")  ? "" : "none";
  if (gSoz) gSoz.style.display = (tur === "SOZ") ? "" : "none";
  if (gDil) gDil.style.display = (tur === "DIL") ? "" : "none";
}

/* ====== CSV -> Map( puanInt => {min,max} ) ======
   - Header varsa otomatik atlar
   - 1. sütun puan, 2. sütun min, 3. sütun max kabul eder
*/
function parseCSVToMap(csvText) {
  const map = new Map();
  const lines = (csvText || "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",").map(s => s.trim());

    if (parts.length < 3) continue;

    // Header yakala: ilk hücre sayı değilse atla
    const puanMaybe = Number(parts[0].replace(",", "."));
    if (!Number.isFinite(puanMaybe)) continue;

    const puan = Math.floor(puanMaybe);

    // min/max sayıları: binlik ayırıcı vs. olabilir diye sadece rakam bırak
    const minStr = parts[1];
    const maxStr = parts[2];

    const min = Number(String(minStr).replace(/\./g, "").replace(/\s/g, "").replace(",", "."));
    const max = Number(String(maxStr).replace(/\./g, "").replace(/\s/g, "").replace(",", "."));

    if (!Number.isFinite(min) || !Number.isFinite(max)) continue;

    map.set(puan, { min: Math.trunc(min), max: Math.trunc(max) });
  }
  return map;
}

async function loadRankMap(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV yüklenemedi: ${url} (${res.status})`);
  const text = await res.text();
  return parseCSVToMap(text);
}

/* Excel mantığı: AŞAĞIYUVARLA(puan) yoksa alt puana in */
function findNearestLower(map, puan) {
  let p = Math.floor(puan);
  while (p >= 0 && !map.has(p)) p--;
  return map.get(p) || null;
}

/* ====== Global rank map’ler ====== */
let SAY_MAP = null;
let EA_MAP  = null;
let SOZ_MAP = null;
let DIL_MAP = null;

function getMapByTur(tur) {
  if (tur === "SAY") return SAY_MAP;
  if (tur === "EA")  return EA_MAP;
  if (tur === "SOZ") return SOZ_MAP;
  if (tur === "DIL") return DIL_MAP;
  return null;
}

document.addEventListener("DOMContentLoaded", async () => {
  const turSelect = document.getElementById("puanTuru");
  const btn = document.getElementById("hesaplaBtn");
  const sonuc = document.getElementById("sonuc");
  const siraEl = document.getElementById("sira");

  if (!turSelect || !btn || !sonuc || !siraEl) return;

  // CSV’leri arka planda yükle (site ilk açılınca)
  // Dosya isimleri: say.csv / ea.csv / soz.csv / dil.csv
  // Repo root’ta durmalı.
  try {
    [SAY_MAP, EA_MAP, SOZ_MAP, DIL_MAP] = await Promise.all([
      loadRankMap("say.csv"),
      loadRankMap("ea.csv"),
      loadRankMap("soz.csv"),
      loadRankMap("dil.csv"),
    ]);
  } catch (e) {
    console.warn(e);
    // CSV gelmezse yine de puan çalışsın; sırayı "—" basar
  }

  showOnlyGroup(turSelect.value);

  turSelect.addEventListener("change", () => {
    showOnlyGroup(turSelect.value);
    sonuc.textContent = "—";
    siraEl.textContent = "Min Sıra: — | Max Sıra: —";
  });

  btn.addEventListener("click", () => {
    const tur = turSelect.value;

    // Ortak
    const x = {
      obp: readNumber("obp"),
      tyt_tr: readNumber("tyt_tr"),
      tyt_sos: readNumber("tyt_sos"),
      tyt_mat: readNumber("tyt_mat"),
      tyt_fen: readNumber("tyt_fen"),
      ayt_mat: 0, ayt_fiz: 0, ayt_kim: 0, ayt_bio: 0,
      ayt_edeb: 0, ayt_tar1: 0, ayt_cog1: 0,
      ayt_tar2: 0, ayt_cog2: 0, ayt_fels: 0, ayt_dkab: 0,
      ydt: 0,
    };

    // Türe göre doğru inputları oku
    if (tur === "SAY") {
      x.ayt_mat = readNumber("ayt_mat");
      x.ayt_fiz = readNumber("ayt_fiz");
      x.ayt_kim = readNumber("ayt_kim");
      x.ayt_bio = readNumber("ayt_bio");
    } else if (tur === "EA") {
      x.ayt_mat  = readNumber("ayt_mat_ea");
      x.ayt_edeb = readNumber("ayt_edeb");
      x.ayt_tar1 = readNumber("ayt_tar1");
      x.ayt_cog1 = readNumber("ayt_cog1");
    } else if (tur === "SOZ") {
      x.ayt_edeb = readNumber("ayt_edeb_soz");
      x.ayt_tar1 = readNumber("ayt_tar1_soz");
      x.ayt_cog1 = readNumber("ayt_cog1_soz");
      x.ayt_tar2 = readNumber("ayt_tar2");
      x.ayt_cog2 = readNumber("ayt_cog2");
      x.ayt_fels = readNumber("ayt_fels");
      x.ayt_dkab = readNumber("ayt_dkab");
    } else if (tur === "DIL") {
      x.ydt = readNumber("ydt");
    }

    const puan = calcScore(tur, x);
    sonuc.textContent = `${tur} Puan: ${puan.toFixed(3)}`;

    const map = getMapByTur(tur);

    if (!map || map.size === 0) {
      siraEl.textContent = "Min Sıra: — | Max Sıra: —";
      return;
    }

    const row = findNearestLower(map, puan);
    if (!row) {
      siraEl.textContent = "Min Sıra: — | Max Sıra: —";
      return;
    }

    siraEl.textContent = `Min Sıra: ${row.min.toLocaleString("tr-TR")} | Max Sıra: ${row.max.toLocaleString("tr-TR")}`;
  });
});
