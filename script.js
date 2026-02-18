// Constants for dimensions (mm to px conversion at 96 DPI, rounded to integers)
const MM_TO_PX = 96 / 25.4; // ≈3.7795
const BG_WIDTH_PX = 650;
const BG_HEIGHT_PX = 522;
let canvasWidthPx = BG_WIDTH_PX;
let canvasHeightPx = BG_HEIGHT_PX;

// Get elements
const urlInput = document.getElementById("urlInput");
const generateBtn = document.getElementById("generateBtn");
const flyerCanvas = document.getElementById("flyerCanvas");
const ctx = flyerCanvas.getContext("2d");
const downloadBtn = document.getElementById("downloadBtn");
const copyBtn = document.getElementById("copyBtn");

// Function to get URL parameter
function getUrlParameter(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Function to get resource label from subtype
function getResourceLabel(subtype) {
  switch (subtype) {
    case "video":
      return "Video Resources";
    case "biomed":
      return "BioMed Resources";
    case "testing":
      return "Testing Resources";
    case "education":
      return "Education Resources";
    case "resourcelink":
      return "General Resources";
    default:
      return "Resources";
  }
}

// Function to generate breadcrumb
function getBreadcrumbFromType(type) {
  if (!type) return "";

  let category, page;

  if (type.startsWith("autopulsenxt")) {
    category = "AutoPulseNXT";
    page = "autopulsenxt.html";
  } else if (type.startsWith("xseries")) {
    category = "X Series";
    page = "xseries.html";
  } else if (type.startsWith("rseries-plus")) {
    category = "R Series PLUS";
    page = "rseries-plus.html";
  } else if (type.startsWith("rseries-als")) {
    category = "R Series ALS";
    page = "rseries-als.html";
  } else if (type.startsWith("internalpaddles")) {
    category = "Accessories & Consumables";
    page = "accessories.html";
  } else if (type.startsWith("aed3bls")) {
    category = "AED 3 BLS";
    page = "aed3bls.html";
  } else if (type.startsWith("aedplus")) {
    category = "AED Plus";
    page = "aedplus.html";
  } else if (type.startsWith("zenix")) {
    category = "Zenix";
    page = "zenix.html";
  } else {
    // default to accessories
    category = "Accessories & Consumables";
    page = "accessories.html";
  }

  // Get the resource subtype (last part after '-')
  const subtype = type.split("-").pop();
  const resourceLabel = getResourceLabel(subtype);

  return `<a href="index.html">Home</a> > <a href="${page}">${category}</a> > ${resourceLabel}`;
}

// Load background image
const bgImage = new Image();

// Load background image based on type parameter
const type = getUrlParameter("type");
// Set QR dimensions based on type
let QR_SIZE_PX, QR_X_PX, QR_Y_PX;

if (!type) {
  alert("Invalid access. Please navigate from the resource page.");
} else {
  if (type.startsWith("autopulsenxt")) {
    QR_SIZE_PX = 267;
    QR_X_PX = 283;
    QR_Y_PX = 164;
  } else if (type.startsWith("xseries")) {
    QR_SIZE_PX = 267;
    QR_X_PX = 344;
    QR_Y_PX = 191;
  } else if (type.startsWith("rseries-plus")) {
    QR_SIZE_PX = 255;
    QR_X_PX = 40;
    QR_Y_PX = 229;
  } else if (type.startsWith("internalpaddles")) {
    QR_SIZE_PX = 267;
    QR_X_PX = 301;
    QR_Y_PX = 208;
  } else if (type.startsWith("aed3bls")) {
    QR_SIZE_PX = 267;
    QR_X_PX = 312;
    QR_Y_PX = 162;
  } else if (type.startsWith("aedplus")) {
    QR_SIZE_PX = 267;
    QR_X_PX = 312;
    QR_Y_PX = 174;
  } else if (type.startsWith("zenix")) {
    // Zenix template: 2000x1608px (189 DPI) represents 268.05x215.65mm
    // Scaled to 650x522px for display
    // QR code: 110mm x 110mm at position (147mm, 80mm)
    // At display scale: 267x267px at (356px, 194px)
    QR_SIZE_PX = 267;
    QR_X_PX = 356;
    QR_Y_PX = 194;
  } else {
    QR_SIZE_PX = 267;
    QR_X_PX = 356;
    QR_Y_PX = 193;
  }

  // Set canvas size based on type configuration
  flyerCanvas.width = canvasWidthPx;
  flyerCanvas.height = canvasHeightPx;

  bgImage.src = "./images/" + type + ".png";
  bgImage.onload = () => {
    // Background image loaded
  };
  bgImage.onerror = () => {
    alert("Background image not found for type: " + type);
  };

  // Generate and set breadcrumb
  const breadcrumbEl = document.getElementById("breadcrumb");
  if (breadcrumbEl) {
    breadcrumbEl.innerHTML = getBreadcrumbFromType(type);
  }

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
  const qr = new qrcode(0, "L");
  qr.addData(url);
  qr.make();
  const size = qr.getModuleCount();
  const qrCanvas = document.createElement("canvas");
  qrCanvas.width = QR_SIZE_PX;
  qrCanvas.height = QR_SIZE_PX;
  const ctxQr = qrCanvas.getContext("2d");
  const scale = QR_SIZE_PX / size;
  const imageData = ctxQr.createImageData(QR_SIZE_PX, QR_SIZE_PX);
  const data = imageData.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isDark = qr.isDark(y, x);
      const color = isDark ? 0 : 255;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const px = Math.floor(x * scale + dx);
          const py = Math.floor(y * scale + dy);
          if (px < QR_SIZE_PX && py < QR_SIZE_PX) {
            const index = (py * QR_SIZE_PX + px) * 4;
            data[index] = color;
            data[index + 1] = color;
            data[index + 2] = color;
            data[index + 3] = 255;
          }
        }
      }
    }
  }
  ctxQr.putImageData(imageData, 0, 0);

  // Clear and draw background
  ctx.clearRect(0, 0, canvasWidthPx, canvasHeightPx);
  ctx.drawImage(bgImage, 0, 0, canvasWidthPx, canvasHeightPx);
  // Draw white background for QR area to avoid lines from background showing through
  ctx.fillStyle = "white";
  ctx.fillRect(QR_X_PX, QR_Y_PX, QR_SIZE_PX, QR_SIZE_PX);
  // Disable smoothing for crisp QR
  ctx.imageSmoothingEnabled = false;
  // Overlay QR code on top
  ctx.drawImage(qrCanvas, QR_X_PX, QR_Y_PX);
  // Show download and copy buttons
  downloadBtn.style.display = "block";
  copyBtn.style.display = "block";
});

// Download flyer on button click
downloadBtn.addEventListener("click", () => {
  flyerCanvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = type + "-flyer.png";
      link.click();
      URL.revokeObjectURL(url);
    }
  }, "image/png");
});

// Copy flyer to clipboard
copyBtn.addEventListener("click", async () => {
  // Feature-detect Clipboard API support
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    alert("This browser does not support copying images to clipboard. Please use a modern browser with clipboard support.");
    return;
  }

  try {
    // Convert canvas to blob
    const blob = await new Promise((resolve, reject) => {
      flyerCanvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      }, "image/png");
    });

    // Copy to clipboard using Clipboard API
    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob
      })
    ]);

    // Show success feedback
    const originalText = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.style.backgroundColor = "#28a745";
    
    // Reset button after 2 seconds
    setTimeout(() => {
      copyBtn.textContent = originalText;
      copyBtn.style.backgroundColor = "";
    }, 2000);
  } catch (err) {
    console.error("Failed to copy image:", err);
    
    // Provide specific error messages based on error type
    let errorMessage = "Failed to copy image to clipboard.";
    if (err.name === "NotAllowedError") {
      errorMessage += " Please grant clipboard permissions to use this feature.";
    } else if (err.name === "NotSupportedError") {
      errorMessage += " Your browser does not support this feature.";
    } else {
      errorMessage += " Please try again.";
    }
    
    alert(errorMessage);
  }
});

// If image is already loaded, trigger onload
if (bgImage.complete && bgImage.onload) {
  bgImage.onload();
}
