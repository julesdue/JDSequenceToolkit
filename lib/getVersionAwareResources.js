/**
 * getVersionAwareResources.js
 *
 * Helper for version detection and version-aware resource loading.
 * Automatically detects Premiere Pro version, extracts major version,
 * and loads presets/resources from the matching payloads/v{majorVersion}/ folder.
 *
 * Usage:
 *   const resources = await getVersionAwareResources();
 *   const presetPath = resources.presets[0]; // Full plugin file URL
 */

const ppro = require("premierepro");

/**
 * Get comprehensive environment and version info
 * @returns {Object} { premiereVersion, majorVersion, uxpVersion, os, ameInstalled }
 */
function getEnvironmentInfo() {
  const uxp = require("uxp");

  // UXP host object provides the host application version (Premiere Pro)
  let premiereVersion = uxp.host?.version;

  if (!premiereVersion) {
    // Fallback: try legacy ppro API paths
    if (ppro.app && ppro.app.version) {
      premiereVersion = ppro.app.version;
    } else if (ppro.version) {
      premiereVersion = ppro.version;
    } else {
      console.warn("Could not detect Premiere version, defaulting to v26");
      premiereVersion = "26.0.0";
    }
  }

  const majorVersion = premiereVersion.split(".")[0]; // e.g., "26"
  const uxpVersion = uxp.versions?.uxp || "unknown";
  const os = require("os").platform(); // "darwin" or "win32"

  let ameInstalled = false;
  try {
    const encoderManager = ppro.EncoderManager.getManager();
    ameInstalled = encoderManager.isAMEInstalled;
  } catch (e) {
    // EncoderManager may not be available in all contexts
    console.warn("Could not check AME installation:", e.message);
  }

  return {
    premiereVersion,
    majorVersion,
    uxpVersion,
    os,
    ameInstalled,
  };
}

/**
 * Show error in a popup window
 * @param {string} title - Popup title
 * @param {string} message - Error message to display
 * @param {string} logContent - Full log content to include
 */
async function showErrorPopup(title, message, logContent = "") {
  const fullMessage = logContent ? `${message}\n\n${logContent}` : message;

  // Log to console
  console.error(`[${title}]`, fullMessage);

  // Show popup alert
  // Note: UXP doesn't have native alert() in some versions, so we use a try-catch
  try {
    if (typeof alert !== "undefined") {
      alert(`${title}\n\n${fullMessage}`);
    } else {
      // Fallback: create a simple notification-style message via console
      console.error(`POPUP: ${title} — ${fullMessage}`);
    }
  } catch (e) {
    console.error("Could not show popup:", e.message);
  }
}

/**
 * Load version-aware resources from payloads/v{majorVersion}/ folder
 * Falls back with error handling if folder doesn't exist
 *
 * @returns {Promise<Object>} { premiereVersion, majorVersion, uxpVersion, os, ameInstalled, resourcePath, presets: [] }
 */
async function getVersionAwareResources() {
  const env = getEnvironmentInfo();

  // Expected plugin file URL path: #file:payloads/v{majorVersion}/
  const resourcePath = `#file:payloads/v${env.majorVersion}/`;

  let presets = [];
  let error = null;

  try {
    // Try to access the versioned payloads folder
    const fs = require("uxp").storage;
    const pluginFolder = await fs.localFileSystem.getPluginFolder();
    const payloadsFolder = await pluginFolder.getEntry("payloads");

    if (!payloadsFolder) {
      throw new Error("payloads folder not found in plugin directory");
    }

    const versionedFolderName = `v${env.majorVersion}`;
    const versionedFolder = await payloadsFolder.getEntry(versionedFolderName);

    if (!versionedFolder) {
      throw new Error(`No folder found for Premiere version ${env.premiereVersion} (looking for payloads/${versionedFolderName}/)`);
    }

    // List presets in the versioned folder
    const entries = await versionedFolder.getEntries();
    presets = entries
      .filter((entry) => entry.isFile && (entry.name.endsWith(".epr") || entry.name.endsWith(".sqpreset")))
      .map((entry) => {
        // Get the actual filesystem path from the entry
        const nativePath = entry.nativePath || entry.path || `${resourcePath}${entry.name}`;
        return {
          name: entry.name,
          path: nativePath,
          fullEntry: entry,
        };
      });

    if (presets.length === 0) {
      console.warn(`No presets found in payloads/${versionedFolderName}/`);
    }
  } catch (e) {
    error = e.message;
    console.error("Resource loading error:", error);

    // Show popup with error details
    await showErrorPopup(
      "Resource Loading Error",
      `Failed to load resources for Premiere Pro v${env.premiereVersion}`,
      `Expected folder: payloads/v${env.majorVersion}/\n\nError: ${error}`
    );
  }

  return {
    premiereVersion: env.premiereVersion,
    majorVersion: env.majorVersion,
    uxpVersion: env.uxpVersion,
    os: env.os,
    ameInstalled: env.ameInstalled,
    resourcePath,
    presets,
    error,
    isSuccessful: error === null && presets.length > 0,
  };
}

/**
 * Get a specific preset by name from version-aware resources
 * @param {string} presetName - e.g., "ALPINALE_Extracts_QT_h264_medium_quality.epr"
 * @returns {Promise<string|null>} Full plugin file URL path or null if not found
 */
async function getPresetPath(presetName) {
  const resources = await getVersionAwareResources();

  const preset = resources.presets.find((p) => p.name === presetName);
  if (preset) {
    console.log(`Found preset: ${presetName}, path: ${preset.path}`);
    return preset.path;
  }

  console.warn(`Preset not found: ${presetName}`);
  await showErrorPopup(
    "Preset Not Found",
    `Could not locate preset: ${presetName}`,
    `Available presets in v${resources.majorVersion}:\n${resources.presets.map((p) => `  - ${p.name}`).join("\n") || "  (none)"}`
  );

  return null;
}

// Export public API
module.exports = {
  getEnvironmentInfo,
  getVersionAwareResources,
  getPresetPath,
  showErrorPopup,
};
