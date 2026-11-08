/**
 * BG Window
 * Main update logic for the backglass window
 */

function updateBGWindow() {
  const container = document.getElementById("rootContainer");
  if (!vpin.tableData || vpin.tableData.length === 0) {
    container.innerHTML = "";
    return;
  }

  if (currentTableIndex < 0 || currentTableIndex >= vpin.tableData.length) {
    currentTableIndex = 0;
  }

  const table = vpin.getTableMeta(currentTableIndex);
  const info = table.meta.Info || {};
  const vpx = table.meta.VPXFile || {};
  const title =
    info.Title || vpx.filename || table.tableDirName || "Unknown Table";

  const bgImageUrl = vpin.getImageURL(currentTableIndex, "bg");

  if (!hasUsableMedia(bgImageUrl)) {
    container.innerHTML = '<div class="empty-state">No BG Media</div>';
    return;
  }

  const existingMedia = container.querySelector("video, img");

  // More efficient cleanup - don't query twice
  if (existingMedia) {
    cleanupMediaElement(container); // ← Cleanup entire container
  }
  container.innerHTML = "";

  const mediaElement = createMediaElement(
    null,
    bgImageUrl,
    title,
    "contain",
    windowOverride,
  );
  if (mediaElement) {
    container.appendChild(mediaElement);
  } else {
    container.innerHTML = '<div class="empty-state">No BG Media</div>';
  }
}
