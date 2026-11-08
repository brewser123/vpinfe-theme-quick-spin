/**
 * Table Window
 * Main update logic for the table (playfield) window
 */

/**
 * Update carousel and metadata immediately (no debounce)
 * Called directly for instant visual feedback
 */
function updateTableWindowCarousel() {
  const container = document.getElementById("rootContainer");
  tableView = ensureTableView(container);

  if (!vpin.tableData || vpin.tableData.length === 0) {
    tableView.shell.style.display = "none";
    tableView.emptyState.style.display = "flex";
    return;
  }

  tableView.shell.style.display = "";
  tableView.emptyState.style.display = "none";

  const table = vpin.getTableMeta(currentTableIndex);
  const info = table.meta.Info || {};
  const vpx = table.meta.VPXFile || {};
  const title =
    info.Title || vpx.filename || table.tableDirName || "Unknown Table";
  const manufacturer = info.Manufacturer || vpx.manufacturer || "";
  const year = info.Year || vpx.year || "";

  updateWheelCarousel(tableView);

  setNodeText(tableView.title, title);
  setNodeText(tableView.manufacturer, manufacturer);
  setNodeText(tableView.year, year);

  if (tableView.manufacturerSeparator) {
    tableView.manufacturerSeparator.style.display =
      manufacturer && year ? "" : "none";
  }

}

/**
 * Update hero media only (debounced)
 */
function updateTableWindowHeroMedia() {
  if (!tableView) return;
  if (!vpin.tableData || vpin.tableData.length === 0) return;

  const table = vpin.getTableMeta(currentTableIndex);
  const info = table.meta.Info || {};
  const vpx = table.meta.VPXFile || {};
  const title =
    info.Title || vpx.filename || table.tableDirName || "Unknown Table";

  updateHeroMedia(tableView.heroMedia, title);
}
