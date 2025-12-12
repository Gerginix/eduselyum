function readNumber(id) {
  const el = document.getElementById(id);
  if (!el) return 0;
  const raw = (el.value ?? "").toString().trim();
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function round3(x) {
  return Math.round(x * 1000) / 1000;
}

// Katsayılar_2025 sheet'inden (fotoğraftaki tablo)
const COEF = {
  EA: {
    intercept: 128.028,
    obpCoef: 0.60285,
    TR: 1.16424,
    SB: 1.33609,
    TM: 1.44715,
    FB: 1.02141,
    AYT_MAT: 2.88393,
    FIZ: 0,
    KIM: 0,
    BIO: 0,
    EDEB: 2.97424,
    TAR1: 2.39932,
    COG1: 2.85842,
    TAR2: 0,
    COG2: 0,
    FELS: 0,
    DKAB: 0,
    YDIL: 0,
  },
  SAY: {
    intercept: 131.024,
    obpCoef: 0.62029,
    TR: 1.18697,
    SB: 1.30313,
    TM: 1.40198,
    FB: 1.05742,
    AYT_MAT: 2.87473,
    FIZ: 2.4126,
    KIM: 2.57134,
    BIO: 2.60486,
    EDEB: 0,
    TAR1: 0,
    COG1: 0,
    TAR2: 0,
    COG2: 0,
    FELS: 0,
    DKAB: 0,
    YDIL: 0,
  },
  SOZ: {
    intercept: 127.213,
    obpCoef: 0.60938,
    TR: 1.09611,
    SB: 1.14037,
    TM: 1.32458,
    FB: 0.98354,
    AYT_MAT: 0,
    FIZ: 0,
    KIM: 0,
    BIO: 0,
    EDEB: 2.86968,
    TAR1: 2.49727,
    COG1: 2.70539,
    TAR2: 3.74723,
    COG2: 2.53476,
    FELS: 3.70284,
    DKAB: 2.55278,
    YDIL: 0,
  },
  DIL: {
    intercept: 106.259,
    obpCoef: 0.57305,
    TR: 1.42611,
    SB: 1.86721,
    TM: 1.92707,
    FB: 1.33508,
    AYT_MAT: 0,
    FIZ: 0,
    KIM: 0,
    BIO: 0,
    EDEB: 0,
    TAR1: 0,
    COG1: 0,
    TAR2: 0,
    COG2: 0,
    FELS: 0,
    DKAB: 0,
    YDIL: 2.60491,
  },
};

function hesaplaPuan(tur, input) {
  const c = COEF[tur];
  if (!c) return null;

  const p =
    c.intercept +
    input.obp * c.obpCoef +
    input.tyt_tr * c.TR +
    input.tyt_sos * c.SB +
    input.tyt_mat * c.TM +
    input.tyt_fen * c.FB +
    input.ayt_mat * c.AYT_MAT +
    input.ayt_fiz * c.FIZ +
    input.ayt_kim * c.KIM +
    input.ayt_bio * c.BIO +
    input.ayt_edeb * c.EDEB +
    input.ayt_tar1 * c.TAR1 +
    input.ayt_cog1 * c.COG1 +
    input.ayt_tar2 * c.TAR2 +
    input.ayt_cog2 * c.COG2 +
    input.ayt_fels * c.FELS +
    input.ayt_dkab * c.DKAB +
    input.ydt * c.YDIL;

  return round3(p);
}

// (Şimdilik) sıralama alanını boş bırakıyoruz.
// Excel'deki min/max sıra formülünü foto ile aldığımız anda burayı birebir dolduracağız.
function hesaplaSiraPlaceholder(tur, puan) {
  return null;
}

function showOnlyGroup(tur) {
  const gSay = document.getElementById("grp_say");
  const gEa = document.getElementById("grp_ea");
  const gSoz = document.getElementById("grp_soz");
  const gDil = document.getElementById("grp_dil");

  if (gSay) gSay.style.display = tur === "SAY" ? "" : "none";
  if (gEa) gEa.style.display = tur === "EA" ? "" : "none";
  if (gSoz) gSoz.style.display = tur === "SOZ" ? "" : "none";
  if (gDil) gDil.style.display = tur === "DIL" ? "" : "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const turSelect = document.getElementById("puanTuru");
  const btn = document.getElementById("hesaplaBtn");
  const sonuc = document.getElementById("sonuc");
  const siraEl = document.getElementById("sira");

  if (!turSelect || !btn || !sonuc || !siraEl) return;

  showOnlyGroup(turSelect.value);
  turSelect.addEventListener("change", () => {
    showOnlyGroup(turSelect.value);
    sonuc.textContent = "—";
    siraEl.textContent = "—";
  });

  btn.addEventListener("click", () => {
    const tur = turSelect.value;

    // TYT
    const tyt_tr = readNumber("tyt_tr");
    const tyt_sos = readNumber("tyt_sos");
    const tyt_mat = readNumber("tyt_mat");
    const tyt_fen = readNumber("tyt_fen");

    // Ortak OBP
    const obp = readNumber("obp");

    // AYT / YDT (türe göre doğru id'lerden oku)
    let ayt_mat = 0, ayt_fiz = 0, ayt_kim = 0, ayt_bio = 0;
    let ayt_edeb = 0, ayt_tar1 = 0, ayt_cog1 = 0, ayt_tar2 = 0, ayt_cog2 = 0, ayt_fels = 0, ayt_dkab = 0;
    let ydt = 0;

    if (tur === "SAY") {
      ayt_mat = readNumber("ayt_mat");
      ayt_fiz = readNumber("ayt_fiz");
      ayt_kim = readNumber("ayt_kim");
      ayt_bio = readNumber("ayt_bio");
    } else if (tur === "EA") {
      ayt_mat = readNumber("ayt_mat_ea");
      ayt_edeb = readNumber("ayt_edeb");
      ayt_tar1 = readNumber("ayt_tar1");
      ayt_cog1 = readNumber("ayt_cog1");
    } else if (tur === "SOZ") {
      ayt_edeb = readNumber("ayt_edeb_soz");
      ayt_tar1 = readNumber("ayt_tar1_soz");
      ayt_cog1 = readNumber("ayt_cog1_soz");
      ayt_tar2 = readNumber("ayt_tar2");
      ayt_cog2 = readNumber("ayt_cog2");
      ayt_fels = readNumber("ayt_fels");
      ayt_dkab = readNumber("ayt_dkab");
    } else if (tur === "DIL") {
      ydt = readNumber("ydt");
    }

    const input = {
      obp,
      tyt_tr, tyt_sos, tyt_mat, tyt_fen,
      ayt_mat, ayt_fiz, ayt_kim, ayt_bio,
      ayt_edeb, ayt_tar1, ayt_cog1, ayt_tar2, ayt_cog2, ayt_fels, ayt_dkab,
      ydt
    };

    const puan = hesaplaPuan(tur, input);
    if (puan === null) {
      sonuc.textContent = "Hata";
      siraEl.textContent = "—";
      return;
    }

    sonuc.textContent = `${tur} Puan: ${puan.toFixed(3)}`;

    const r = hesaplaSiraPlaceholder(tur, puan);
    siraEl.textContent = r ? `Sıralama (Min–Max): ${r.min} – ${r.max}` : "—";
  });
});
