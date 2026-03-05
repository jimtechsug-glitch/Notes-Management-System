// pwa-install.js
let deferredPrompt;

// Create the install banner UI dynamically
function createInstallBanner() {
  const banner = document.createElement("div");
  banner.id = "pwa-install-banner";
  banner.style.cssText = `
    display: none;
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: white;
    padding: 15px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    z-index: 9999;
    align-items: center;
    gap: 15px;
    width: 90%;
    max-width: 400px;
    font-family: system-ui, -apple-system, sans-serif;
  `;

  banner.innerHTML = `
    <img src="/assets/images/icon-192.png" alt="App Icon" style="width: 45px; height: 45px; border-radius: 10px;">
    <div style="flex-grow: 1;">
      <h4 style="margin: 0 0 5px 0; font-size: 16px; color: #333;">Install Nsoma DigLibs</h4>
      <p style="margin: 0; font-size: 13px; color: #666;">Add to your home screen for quick access.</p>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="pwa-install-btn" style="
        background: #4a90e2; 
        color: white; 
        border: none; 
        padding: 8px 15px; 
        border-radius: 6px; 
        font-weight: 600; 
        cursor: pointer;
      ">Install</button>
      <button id="pwa-dismiss-btn" style="
        background: transparent; 
        color: #888; 
        border: none; 
        padding: 4px; 
        font-size: 12px; 
        cursor: pointer;
      ">Not Now</button>
    </div>
  `;

  document.body.appendChild(banner);

  document
    .getElementById("pwa-install-btn")
    .addEventListener("click", async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
        banner.style.display = "none";
      }
    });

  document.getElementById("pwa-dismiss-btn").addEventListener("click", () => {
    banner.style.display = "none";
    // Remember dismissal for this session
    sessionStorage.setItem("pwa-prompt-dismissed", "true");
  });

  return banner;
}

// Global service worker registration function for all pages
function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful:",
            registration.scope,
          );
        })
        .catch((error) => {
          console.log("ServiceWorker registration failed:", error);
        });
    });
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  registerServiceWorker();

  const banner = createInstallBanner();

  // Listen for the install prompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;

    // Show our custom UI
    if (!sessionStorage.getItem("pwa-prompt-dismissed")) {
      banner.style.display = "flex";
    }
  });

  // Successfully installed
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    banner.style.display = "none";
    console.log("PWA was installed");
  });
});
