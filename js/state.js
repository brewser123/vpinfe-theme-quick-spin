/**
 * State Management
 * Global state variables for the theme
 */

// Window identification
let windowName = "";

// Table navigation
let currentTableIndex = 0;

// Display configuration
let isTablePortrait = false;
let tableRotationDegrees = 0;
let isNativePortrait = false;

// Configuration
let windowOverride = null;

// Debounce timers
let heroUpdateDebounceTimer = null;
let tableOrder = [];
let sortMode = "plays";

function rebuildTableOrder() {
  const count = vpin.tableData?.length || 0;
  tableOrder = Array.from({ length: count }, (_, index) => index);
  const plays = (index) => {
    const meta = vpin.getTableMeta(index)?.meta || {};
    return Number(meta.User?.StartCount ?? meta.VPX?.RunCount ?? 0) || 0;
  };
  const title = (index) => {
    const table = vpin.getTableMeta(index);
    return String(table?.meta?.Info?.Title || table?.tableDirName || "");
  };
  tableOrder.sort((a, b) =>
    (sortMode === "plays" ? plays(b) - plays(a) : 0) ||
    title(a).localeCompare(title(b)) || a - b
  );
}

function toggleSortMode() {
  sortMode = sortMode === "plays" ? "alphabetical" : "plays";
  rebuildTableOrder();
  const button = document.getElementById("sortModeButton");
  if (button) button.textContent = sortMode === "plays" ? "Most played (S)" : "A–Z (S)";
  if (windowName === "table") updateTableWindowCarousel();
}

function moveTable(step) {
  if (tableOrder.length !== (vpin.tableData?.length || 0)) rebuildTableOrder();
  if (!tableOrder.length) return currentTableIndex;
  const position = tableOrder.indexOf(currentTableIndex);
  return tableOrder[wrapIndex(Math.max(0, position) + step, tableOrder.length)];
}
let bgUpdateDebounceTimer = null;
let dmdUpdateDebounceTimer = null;

// View references
let tableView = null;

// Auto-advance timer
let autoAdvanceTimer = null;
let isAutoAdvancing = false;
const AUTO_ADVANCE_INITIAL_DELAY = 30000; // 30 seconds
const AUTO_ADVANCE_INTERVAL = 10000; // 10 seconds

// Game state
let isGameRunning = false;
