/**
 * Hero Media Management
 * Handles table window video/image loading and rotation rendering
 */

function buildHeroImage(imageUrl, title) {
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = title;
  img.className = "hero-media-asset";
  img.onerror = () => {
    img.src = "";
    img.alt = `${title} media unavailable`;
  };
  return img;
}

function applyMediaRotation(element) {
  if (!element) return;

  const normalized = ((tableRotationDegrees % 360) + 360) % 360;
  const swapAxes = normalized === 90 || normalized === 270 || isNativePortrait;
  const mediaRotation = isNativePortrait
    ? 90
    : swapAxes
      ? -tableRotationDegrees
      : tableRotationDegrees;

  if (swapAxes) {
    element.style.width = "177.78%";
    element.style.height = "56.25%";
    element.style.maxWidth = "none";
    element.style.maxHeight = "none";
    element.style.objectFit = "fill";
    element.style.transform = `rotate(${mediaRotation}deg)`;
  } else {
    element.style.width = "100%";
    element.style.height = "100%";
    element.style.maxWidth = "";
    element.style.maxHeight = "";
    element.style.objectFit = "cover";
    element.style.transform =
      mediaRotation !== 0 ? `rotate(${mediaRotation}deg)` : "none";
  }
}

function updateHeroMedia(container, title) {
  const imageUrl = vpin.getImageURL(currentTableIndex, "table");

  const newFrame = document.createElement("div");
  newFrame.className = "hero-media-frame hero-media-layer is-entering";
  newFrame.dataset.imageUrl = imageUrl;

  let activated = false;
  const activateLayer = () => {
    if (activated) return;
    activated = true;

    requestAnimationFrame(() => {
      newFrame.classList.remove("is-entering");
      newFrame.classList.add("is-active");

      const oldLayers = container.querySelectorAll(
        ".hero-media-frame:not(.is-entering)",
      );
      oldLayers.forEach((layer) => {
        if (layer !== newFrame) {
          layer.remove();
        }
      });
    });
  };

  if (hasUsableMedia(imageUrl)) {
    const image = buildHeroImage(imageUrl, title);
    image.onload = () => {
      image.classList.toggle("is-portrait", image.naturalHeight > image.naturalWidth);
      activateLayer();
    };
    image.onerror = activateLayer;
    newFrame.appendChild(image);
    applyMediaRotation(image);
  }

  container.appendChild(newFrame);
}
