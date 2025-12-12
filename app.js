function readNumber(id) {
  const raw = (document.getElementById(id)?.value ?? "").toString().trim();
  const normalized = raw.replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function round3(x) {
  return Math.round(x * 1000) / 1000;
}

// SAY PUAN KATSAYILARI (2025)
const SAY = {
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
};

function hesaplaSAY(input) {
  const p =
    SAY.intercept +
    input.obp * SAY.obpCoef +
    input.tyt_tr * SAY.TR +
    input.tyt_sos * SAY.SB +
    input.tyt_mat * SAY.TM +
    input.tyt_fen * SAY.FB +
    input.ayt_mat * SAY.AYT_MAT +
    input.ayt_fiz * SAY.FIZ +
    input.ayt_kim * SAY.KIM +
    input.ayt_bio * SAY.BIO;

  return round3(p);
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("hesaplaBtn");
  const sonuc = document.getElementById("sonuc");

  if (!btn || !sonuc) {
    console.log("UI elemanları bulunamadı");
    return;
  }

  btn.addEventListener("click", () => {
    const input = {
      obp: readNumber("obp"),
      tyt_tr: readNumber("tyt_tr"),
      tyt_sos: readNumber("tyt_sos"),
      tyt_mat: readNumber("tyt_mat"),
      tyt_fen: readNumber("tyt_fen"),
      ayt_mat: readNumber("ayt_mat"),
      ayt_fiz: readNumb_

