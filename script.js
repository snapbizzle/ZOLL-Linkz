// Constants for dimensions (mm to px conversion at 96 DPI, rounded to integers)
const MM_TO_PX = 96 / 25.4; // ≈3.7795
const BG_WIDTH_PX = Math.round(268.05 * MM_TO_PX); // 1014
const BG_HEIGHT_PX = Math.round(215.65 * MM_TO_PX); // 815
const QR_SIZE_PX = Math.round(110 * MM_TO_PX); // 416
const QR_X_PX = Math.round(146.78 * MM_TO_PX); // 555
const QR_Y_PX = Math.round(79.69 * MM_TO_PX); // 301

// Get elements
const urlInput = document.getElementById("urlInput");
const generateBtn = document.getElementById("generateBtn");
const flyerCanvas = document.getElementById("flyerCanvas");
const ctx = flyerCanvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");

// Set canvas size
flyerCanvas.width = BG_WIDTH_PX;
flyerCanvas.height = BG_HEIGHT_PX;

// Function to get URL parameter
function getUrlParameter(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Load background image
const bgImage = new Image();

// Load background image based on type parameter
const type = getUrlParameter("type");
if (!type) {
  alert("Invalid access. Please navigate from the resource page.");
} else {
  bgImage.src = "./" + type + ".png";
  bgImage.onload = () => {
    // Background image loaded
  };
  bgImage.onerror = () => {
    alert("Background image not found for type: " + type);
  };

  // If image is already loaded, trigger onload
  if (bgImage.complete) bgImage.onload();
}

// Generate flyer on button click
generateBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  if (!url) {
    alert("Please enter a valid URL.");
    return;
  }
  if (!bgImage.complete) {
    alert("Background image not loaded yet. Please wait and try again.");
    return;
  }

  if (typeof qrcode === "undefined") {
    alert(
      "QRCode library not loaded. Please check your internet connection or reload the page."
    );
    return;
  }

  // Generate QR code first
  const qr = new qrcode(0, "M");
  qr.addData(url);
  qr.make();
  const size = qr.getModuleCount();
  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = QR_SIZE_PX;
  qrCanvas.height = QR_SIZE_PX;
  const ctxQr = qrCanvas.getContext("2d");
  const scale = QR_SIZE_PX / size;
  ctxQr.fillStyle = "#FFFFFF";
  ctxQr.fillRect(0, 0, QR_SIZE_PX, QR_SIZE_PX);
  ctxQr.fillStyle = "#000000";
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.isDark(y, x)) {
        ctxQr.fillRect(
          Math.round(x * scale),
          Math.round(y * scale),
          Math.round(scale),
          Math.round(scale)
        );
      }
    }
  }

  // Clear and draw background
  ctx.clearRect(0, 0, BG_WIDTH_PX, BG_HEIGHT_PX);
  ctx.drawImage(bgImage, 0, 0, BG_WIDTH_PX, BG_HEIGHT_PX);
  // Overlay QR code on top
  ctx.drawImage(qrCanvas, QR_X_PX, QR_Y_PX);
  // Show download button
  downloadBtn.style.display = "block";
});

// Download flyer on button click
downloadBtn.addEventListener("click", () => {
  flyerCanvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "flyer.png";
      link.click();
      URL.revokeObjectURL(url);
    }
  }, "image/png");
});

// If image is already loaded, trigger onload
if (bgImage.complete) bgImage.onload();
