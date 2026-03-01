/**
 * =============================================================================
 * Open Bookmarks in New Tab — Popup Script
 * =============================================================================
 *
 * Responsibilities:
 *   - Read settings from the background service worker on popup open
 *   - Bind UI controls (toggle, select) to settings updates
 *   - Persist changes through chrome.runtime messages
 *   - Update visual state (status text, disabled sections) reactively
 *   - Show a brief loading indicator when toggling enabled/disabled,
 *     because the background worker needs time to rewrite all bookmarks
 *
 * All DOM access is wrapped in DOMContentLoaded for safety, although
 * the <script> tag is placed at the end of <body>.
 * =============================================================================
 */

document.addEventListener("DOMContentLoaded", () => {

  // ─── DOM References ──────────────────────────────────────────────────
  const enabledToggle   = document.getElementById("enabled-toggle");
  const focusToggle     = document.getElementById("focus-toggle");
  const positionSelect  = document.getElementById("position-select");
  const statusText      = document.getElementById("status-text");
  const settingsSection = document.getElementById("settings-section");

  // ─── Initialise UI from stored settings ──────────────────────────────

  /**
   * Fetches current settings from the background worker and applies them
   * to the popup's UI controls.
   */
  async function initUI() {
    try {
      const response = await chrome.runtime.sendMessage({ type: "getSettings" });
      if (response && response.settings) {
        applySettingsToUI(response.settings);
      }
    } catch (err) {
      console.warn("[Popup] Could not load settings:", err);
    }
  }

  /**
   * Maps a settings object → DOM control states.
   * @param {Object} s  The settings object from background.js
   */
  function applySettingsToUI(s) {
    enabledToggle.checked  = s.enabled;
    focusToggle.checked    = s.focusNewTab;
    positionSelect.value   = s.position;
    updateVisualState(s.enabled);
  }

  /**
   * Toggles the visual "enabled / disabled" appearance of the popup.
   * @param {boolean} isEnabled
   * @param {boolean} [isBusy=false]  If true, show a "working" message
   */
  function updateVisualState(isEnabled, isBusy = false) {
    if (isBusy) {
      // Show a brief status while bookmarks are being rewritten
      statusText.textContent = isEnabled
        ? "Enabling… updating bookmarks"
        : "Disabling… restoring bookmarks";
      statusText.classList.remove("toggle-row__hint--off");
      statusText.classList.add("toggle-row__hint--busy");
    } else if (isEnabled) {
      statusText.textContent = "Bookmarks open in a new tab";
      statusText.classList.remove("toggle-row__hint--off");
      statusText.classList.remove("toggle-row__hint--busy");
    } else {
      statusText.textContent = "Extension is paused";
      statusText.classList.add("toggle-row__hint--off");
      statusText.classList.remove("toggle-row__hint--busy");
    }

    // Grey out settings when disabled
    settingsSection.classList.toggle("settings-card--disabled", !isEnabled);
  }

  // ─── Event Handlers ──────────────────────────────────────────────────

  /**
   * Sends a partial settings update to the background worker.
   * Returns a promise that resolves when the background acknowledges.
   * @param {Object} partial  Key–value pairs to merge into settings
   * @returns {Promise}
   */
  function updateSetting(partial) {
    return chrome.runtime.sendMessage({
      type: "updateSettings",
      data: partial,
    });
  }

  /**
   * Main on/off toggle.
   * Toggling enabled/disabled triggers a full bookmark rewrite in the
   * background, so we show a brief busy state and disable the toggle
   * to prevent rapid clicking.
   */
  enabledToggle.addEventListener("change", async () => {
    const isEnabled = enabledToggle.checked;

    // Disable toggle while bookmarks are being rewritten
    enabledToggle.disabled = true;
    updateVisualState(isEnabled, true);

    try {
      await updateSetting({ enabled: isEnabled });
    } catch (err) {
      console.warn("[Popup] Failed to update enabled state:", err);
    }

    // Small delay so the user sees the busy state before it resolves
    // (the actual bookmark rewriting happens asynchronously in background)
    setTimeout(() => {
      enabledToggle.disabled = false;
      updateVisualState(isEnabled);
    }, 600);
  });

  // Focus new tab toggle
  focusToggle.addEventListener("change", () => {
    updateSetting({ focusNewTab: focusToggle.checked });
  });

  // Tab position dropdown
  positionSelect.addEventListener("change", () => {
    updateSetting({ position: positionSelect.value });
  });

  // ─── Kick off ────────────────────────────────────────────────────────
  initUI();
});
