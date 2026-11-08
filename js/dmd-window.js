/**
 * DMD Window
 * Main update logic for the dmd window
 */

function updateDMDWindow() {
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

  const dmdImageUrl = vpin.getImageURL(currentTableIndex, "dmd");
  const dmdVideoUrl = vpin.getVideoURL(currentTableIndex, "dmd");

  if (!hasUsableMedia(dmdVideoUrl) && !hasUsableMedia(dmdImageUrl)) {
    container.innerHTML = '<div class="empty-state">No DMD Media</div>';
    return;
  }

  const existingMedia = container.querySelector("video, img");

  if (existingMedia) {
    cleanupMediaElement(container);
  }
  container.innerHTML = "";

  const mediaElement = createMediaElement(
    dmdVideoUrl,
    dmdImageUrl,
    title,
    "contain",
    windowOverride,
  );
  if (mediaElement) {
    container.appendChild(mediaElement);
  } else {
    container.innerHTML = '<div class="empty-state">No DMD Media</div>';
  }
}
