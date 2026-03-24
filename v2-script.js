// ─────────────────────────────────────────────
// ZOLL-Linkz v2 – QR Flyer Generator
// ─────────────────────────────────────────────

// ── Constants ────────────────────────────────

const DEVICES = {
  "rseries-plus": "R Series PLUS",
  "rseries-als": "R Series ALS",
  xseries: "X Series",
  autopulsenxt: "AutoPulse NXT",
  aed3bls: "AED 3 BLS",
  aedplus: "AED Plus",
  zenix: "Zenix",
  accessories: "Accessories & Consumables",
};

const STAFF_LABELS = {
  clinical: "Clinical Staff",
  biomed: "BioMed Staff",
};

const URL_CONFIG = {
  clinical: {
    label1: "Education Resource Link",
    label2: "Testing Resource Link",
  },
  biomed: {
    label1: "BioMed Resource Link",
    label2: "Configuration Resource Link",
  },
};

// Export canvas dimensions
const FLYER_W = 760;
const FLYER_H = 530;
const HEADER_H = 90;
const FOOTER_H = 44;
const CARD_MARGIN = 30;
const CARD_GAP = 20;
const CARD_W = (FLYER_W - CARD_MARGIN * 2 - CARD_GAP) / 2; // 340
const CARD_H = FLYER_H - HEADER_H - FOOTER_H - 36; // 360
const CARD_TOP = HEADER_H + 18;
const QR_SIZE = 210; // pixels inside card
const ZOLL_BLUE = "#0675cd";
const CARD_RADIUS = 10;
const MAX_URL_DISPLAY_CHARS = 55; // max characters shown in canvas URL text

// ── State ─────────────────────────────────────

let selectedDevice = null;
let selectedStaff = null;
let generatedQr1 = null;
let generatedQr2 = null;
let storedUrl1 = "";
let storedUrl2 = "";

// Pre-load logo image for canvas export
const logoImg = new Image();
logoImg.src = "logo-zoll-w.png";

// ── Utilities ─────────────────────────────────

function showStep(n) {
  [1, 2, 3, 4].forEach((i) => {
    const el = document.getElementById("step" + i);
    if (el) el.style.display = i === n ? "" : "none";
  });
  // Update breadcrumb
  const bc = document.getElementById("breadcrumb");
  if (bc) {
    const deviceLabel = selectedDevice ? DEVICES[selectedDevice] : null;
    const staffLabel = selectedStaff ? STAFF_LABELS[selectedStaff] : null;
    let crumb = '<a href="index.html">Home</a> &gt; <a href="v2.html">QR Flyer v2</a>';
    if (deviceLabel) crumb += " &gt; " + deviceLabel;
    if (staffLabel) crumb += " &gt; " + staffLabel;
    bc.innerHTML = crumb;
  }
}

// Generate QR data object from a URL using the bundled qrcode library
function buildQrData(url) {
  const qr = new qrcode(0, "L");
  qr.addData(url);
  qr.make();
  return qr;
}

// Paint a QR data object onto an existing canvas element
function paintQrToCanvas(canvasEl, qrData, size) {
  canvasEl.width = size;
  canvasEl.height = size;
  const ctx = canvasEl.getContext("2d");
  const moduleCount = qrData.getModuleCount();
  const scale = size / moduleCount;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      const dark = qrData.isDark(row, col);
      const color = dark ? 0 : 255;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = Math.floor(col * scale + dx);
          const py = Math.floor(row * scale + dy);
          if (px < size && py < size) {
            const idx = (py * size + px) * 4;
            data[idx] = color;
            data[idx + 1] = color;
            data[idx + 2] = color;
            data[idx + 3] = 255;
          }
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// ── Export canvas helpers ─────────────────────

function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function renderQrOnExportCanvas(ctx, qrData, x, y, size) {
  const moduleCount = qrData.getModuleCount();
  const scale = size / moduleCount;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      ctx.fillStyle = qrData.isDark(row, col) ? "#000000" : "#ffffff";
      const px = Math.round(x + col * scale);
      const py = Math.round(y + row * scale);
      const pw = Math.round(x + (col + 1) * scale) - px;
      const ph = Math.round(y + (row + 1) * scale) - py;
      ctx.fillRect(px, py, pw, ph);
    }
  }
}

function wrapText(ctx, text, maxWidth) {
  // Returns an array of lines that fit within maxWidth
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildExportCanvas() {
  const canvas = document.getElementById("exportCanvas");
  canvas.width = FLYER_W;
  canvas.height = FLYER_H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, FLYER_W, FLYER_H);

  // ── Header ──────────────────────────────────
  ctx.fillStyle = ZOLL_BLUE;
  ctx.fillRect(0, 0, FLYER_W, HEADER_H);

  // Logo
  if (logoImg.complete && logoImg.naturalWidth > 0) {
    const logoH = 42;
    const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight));
    ctx.drawImage(logoImg, 20, Math.round((HEADER_H - logoH) / 2), logoW, logoH);
  }

  // Device name
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(DEVICES[selectedDevice] || "", FLYER_W / 2, HEADER_H / 2 - 10);

  // Staff type label
  ctx.font = "15px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(
    (STAFF_LABELS[selectedStaff] || "") + " Resources",
    FLYER_W / 2,
    HEADER_H / 2 + 14
  );

  // ── Cards ────────────────────────────────────
  const cfg = URL_CONFIG[selectedStaff] || {};
  const cards = [
    { x: CARD_MARGIN, qr: generatedQr1, label: cfg.label1, url: storedUrl1 },
    { x: CARD_MARGIN + CARD_W + CARD_GAP, qr: generatedQr2, label: cfg.label2, url: storedUrl2 },
  ];

  cards.forEach(({ x, qr, label, url }) => {
    if (!qr) return;

    // Card background with border
    ctx.fillStyle = "#f8f9fa";
    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, x, CARD_TOP, CARD_W, CARD_H, CARD_RADIUS);
    ctx.fill();
    ctx.stroke();

    // QR code (centered in card)
    const qrX = x + Math.round((CARD_W - QR_SIZE) / 2);
    const qrY = CARD_TOP + 20;
    renderQrOnExportCanvas(ctx, qr, qrX, qrY, QR_SIZE);

    // Label
    ctx.fillStyle = ZOLL_BLUE;
    ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelLines = wrapText(ctx, label || "", CARD_W - 20);
    const labelStartY = qrY + QR_SIZE + 22;
    labelLines.forEach((line, i) => {
      ctx.fillText(line, x + CARD_W / 2, labelStartY + i * 20);
    });

    // URL (truncated)
    const urlY = labelStartY + labelLines.length * 20 + 10;
    ctx.fillStyle = "#6c757d";
    ctx.font = "11px 'Segoe UI', Arial, sans-serif";
    const shortUrl =
      url.length > MAX_URL_DISPLAY_CHARS
        ? url.substring(0, MAX_URL_DISPLAY_CHARS - 3) + "..."
        : url;
    ctx.fillText(shortUrl, x + CARD_W / 2, urlY);
  });

  // ── Footer ───────────────────────────────────
  ctx.fillStyle = ZOLL_BLUE;
  ctx.fillRect(0, FLYER_H - FOOTER_H, FLYER_W, FOOTER_H);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "13px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("zoll.com", FLYER_W / 2, FLYER_H - FOOTER_H / 2);

  return canvas;
}

// ── Flyer preview (HTML) ──────────────────────

function updateFlyerPreview(url1, url2) {
  const cfg = URL_CONFIG[selectedStaff] || {};

  // Header text
  document.getElementById("fpDeviceName").textContent =
    DEVICES[selectedDevice] || "";
  document.getElementById("fpStaffType").textContent =
    (STAFF_LABELS[selectedStaff] || "") + " Resources";

  // QR canvases
  const qr1Canvas = document.getElementById("qrCanvas1");
  const qr2Canvas = document.getElementById("qrCanvas2");
  paintQrToCanvas(qr1Canvas, generatedQr1, 180);
  paintQrToCanvas(qr2Canvas, generatedQr2, 180);

  // Labels + links
  document.getElementById("fpLabel1").textContent = cfg.label1 || "";
  document.getElementById("fpLabel2").textContent = cfg.label2 || "";

  const link1 = document.getElementById("fpLink1");
  link1.href = url1;
  link1.textContent = cfg.label1 || "Open Link";

  const link2 = document.getElementById("fpLink2");
  link2.href = url2;
  link2.textContent = cfg.label2 || "Open Link";
}

// ── Step event wiring ─────────────────────────

// Step 1 – device buttons
document.querySelectorAll(".device-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedDevice = btn.dataset.device;
    showStep(2);
  });
});

// Step 2 – staff buttons
document.querySelectorAll(".staff-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    selectedStaff = btn.dataset.staff;
    const cfg = URL_CONFIG[selectedStaff] || {};
    document.getElementById("urlLabel1").textContent = cfg.label1 || "URL 1";
    document.getElementById("urlLabel2").textContent = cfg.label2 || "URL 2";
    document.getElementById("urlInput1").placeholder =
      "https://  (" + (cfg.label1 || "URL 1") + ")";
    document.getElementById("urlInput2").placeholder =
      "https://  (" + (cfg.label2 || "URL 2") + ")";
    document.getElementById("urlInput1").value = "";
    document.getElementById("urlInput2").value = "";
    showStep(3);
  });
});

// Step 3 – generate button
document.getElementById("generateBtn").addEventListener("click", () => {
  const url1 = document.getElementById("urlInput1").value.trim();
  const url2 = document.getElementById("urlInput2").value.trim();

  if (!url1 || !url2) {
    alert("Please enter both URLs before generating the flyer.");
    return;
  }

  if (typeof qrcode === "undefined") {
    alert(
      "QR code library not loaded. Please check your internet connection and reload the page."
    );
    return;
  }

  storedUrl1 = url1;
  storedUrl2 = url2;

  generatedQr1 = buildQrData(url1);
  generatedQr2 = buildQrData(url2);

  updateFlyerPreview(url1, url2);
  showStep(4);
});

// Back buttons
document.getElementById("backToStep1").addEventListener("click", () => {
  showStep(1);
});
document.getElementById("backToStep2").addEventListener("click", () => {
  showStep(2);
});
document.getElementById("backToStep3").addEventListener("click", () => {
  showStep(3);
});

// Reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  selectedDevice = null;
  selectedStaff = null;
  generatedQr1 = null;
  generatedQr2 = null;
  storedUrl1 = "";
  storedUrl2 = "";
  showStep(1);
});

// Download button
document.getElementById("downloadBtn").addEventListener("click", () => {
  if (!generatedQr1 || !generatedQr2) return;
  const canvas = buildExportCanvas();
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      (selectedDevice || "device") +
      "-" +
      (selectedStaff || "staff") +
      "-flyer.png";
    link.click();
    URL.revokeObjectURL(url);
  }, "image/png");
});

// Copy button
document.getElementById("copyBtn").addEventListener("click", async () => {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    alert(
      "This browser does not support copying images to clipboard. Please use a modern browser."
    );
    return;
  }
  if (!generatedQr1 || !generatedQr2) return;
  try {
    const blob = await new Promise((resolve, reject) => {
      buildExportCanvas().toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error("Failed to convert canvas to blob"));
      }, "image/png");
    });
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    const btn = document.getElementById("copyBtn");
    const orig = btn.textContent;
    btn.textContent = "Copied!";
    btn.style.backgroundColor = "#28a745";
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.backgroundColor = "";
    }, 2000);
  } catch (err) {
    console.error("Failed to copy:", err);
    let msg = "Failed to copy image to clipboard.";
    if (err.name === "NotAllowedError") {
      msg += " Please grant clipboard permissions.";
    } else if (err.name === "NotSupportedError") {
      msg += " Your browser does not support this feature.";
    } else {
      msg += " Please try again.";
    }
    alert(msg);
  }
});

// ── Init ─────────────────────────────────────
showStep(1);
