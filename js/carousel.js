/**
 * Carousel
 * Fast wheel carousel rendering
 */

function createWheelTrack() {
  const wheelTrack = document.createElement("div");
  wheelTrack.className = "wheel-track";
  for (let offset = -3; offset <= 3; offset += 1) {
    const card = document.createElement("div");
    card.className = "wheel-card";
    card.dataset.offset = String(offset);
    wheelTrack.appendChild(card);
  }
  return wheelTrack;
}

function renderWheelCarousel(track, centerIndex) {
  const cards = Array.from(track.children);

  cards.forEach((card) => {
    const offset = Number(card.dataset.offset || 0);
    if (tableOrder.length !== vpin.getTableCount()) rebuildTableOrder();
    const position = tableOrder.indexOf(centerIndex);
    const index = tableOrder[wrapIndex(Math.max(0, position) + offset, tableOrder.length)];
    const table = vpin.getTableMeta(index);
    const info = table.meta.Info || {};
    const vpx = table.meta.VPXFile || {};
    const title =
      info.Title || vpx.filename || table.tableDirName || "Unknown Table";
    const wheelUrl = vpin.getImageURL(index, "wheel");
    const isActive = offset === 0;
    const isNear = Math.abs(offset) === 1;

    card.className = isActive
      ? "wheel-card active"
      : isNear
        ? "wheel-card dim-near"
        : "wheel-card";

    let img = card.querySelector("img");
    let fallback = card.querySelector(".wheel-fallback");

    if (hasUsableMedia(wheelUrl)) {
      if (!img) {
        img = document.createElement("img");
        img.decoding = "async";
        img.onerror = () => {
          img.src = "";
          img.style.display = "none";
          let nextFallback = card.querySelector(".wheel-fallback");
          if (!nextFallback) {
            nextFallback = document.createElement("div");
            nextFallback.className = "wheel-fallback";
            card.appendChild(nextFallback);
          }
          nextFallback.textContent = title;
          nextFallback.style.display = "";
        };
        card.appendChild(img);
      }
      img.alt = title;
      if (img.src !== wheelUrl) {
        img.src = wheelUrl;
      }
      img.style.display = "";
      if (fallback) fallback.style.display = "none";
    } else {
      if (!fallback) {
        fallback = document.createElement("div");
        fallback.className = "wheel-fallback";
        card.appendChild(fallback);
      }
      fallback.textContent = title;
      fallback.style.display = "";
      if (img) {
        img.src = "";
        img.style.display = "none";
      }
    }
  });
}

function updateWheelCarousel(view) {
  // Keep seven image nodes and update them directly while browsing.
  renderWheelCarousel(view.wheelTrack, currentTableIndex);
}
