// PWA functionality for ZOLL-Linkz

// Register service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("Service Worker registered:", registration);

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // New version available
                showUpdateNotification();
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  });
}

// Show update notification
function showUpdateNotification() {
  const notification = document.createElement("div");
  notification.id = "pwa-update-notification";
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007bff;
      color: white;
      padding: 15px 20px;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: Arial, sans-serif;
      max-width: 300px;
    ">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Update Available</p>
      <p style="margin: 0 0 15px 0; font-size: 14px;">A new version of ZOLL-Linkz is available.</p>
      <div>
        <button id="update-btn" style="
          background: white;
          color: #007bff;
          border: none;
          padding: 8px 16px;
          border-radius: 3px;
          cursor: pointer;
          font-weight: bold;
          margin-right: 10px;
        ">Update Now</button>
        <button id="dismiss-btn" style="
          background: transparent;
          color: white;
          border: 1px solid white;
          padding: 8px 16px;
          border-radius: 3px;
          cursor: pointer;
        ">Later</button>
      </div>
    </div>
  `;

  document.body.appendChild(notification);

  // Handle update button
  document.getElementById("update-btn").addEventListener("click", () => {
    // Tell service worker to skip waiting and activate new version
    navigator.serviceWorker.ready.then((registration) => {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    });

    // Reload the page
    window.location.reload();
  });

  // Handle dismiss button
  document.getElementById("dismiss-btn").addEventListener("click", () => {
    notification.remove();
  });
}

// Handle install prompt
let deferredPrompt;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the default prompt
  e.preventDefault();
  deferredPrompt = e;

  // Show custom install button if desired
  // You can add a button with id="install-btn" to show install prompt
  const installBtn = document.getElementById("install-btn");
  if (installBtn) {
    installBtn.style.display = "block";
    installBtn.addEventListener("click", () => {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        deferredPrompt = null;
      });
    });
  }
});

// Check if app is installed
window.addEventListener("appinstalled", (evt) => {
  console.log("App was installed successfully");
});
