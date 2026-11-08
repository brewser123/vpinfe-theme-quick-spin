/** Optional loading art, contained within this theme's img directory. */
const MAX_LOADING_IMAGE_BYTES = 3 * 1024 * 1024;
const MAX_LOADING_IMAGE_SIDE = 1920;
const MAX_LOADING_IMAGE_PIXELS = 2_100_000;

function loadingImageType(filename) {
  const match = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}\.(png|jpe?g|webp|gif)$/i.exec(filename);
  if (!match) return null;
  const extension = match[1].toLowerCase();
  return {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  }[extension];
}

function hasImageSignature(bytes, type) {
  const ascii = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  if (type === "image/png") {
    return bytes.length >= 8 &&
      [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  }
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  }
  if (type === "image/webp") {
    return bytes.length >= 12 && ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  }
  return bytes.length >= 6 && (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a");
}

function isAllowedLoadingDimensions(width, height) {
  return width > 0 && height > 0 &&
    width <= MAX_LOADING_IMAGE_SIDE && height <= MAX_LOADING_IMAGE_SIDE &&
    width * height <= MAX_LOADING_IMAGE_PIXELS;
}

function loadingImageRotation(value) {
  const rotation = Number(value);
  return [0, 90, 180, 270].includes(rotation) ? rotation : 0;
}

function calculateLoadingImageFit(width, height, viewportWidth, viewportHeight, rotation) {
  const quarterTurn = rotation === 90 || rotation === 270;
  const rotatedWidth = quarterTurn ? height : width;
  const rotatedHeight = quarterTurn ? width : height;
  const maxWidth = Math.min(viewportWidth * 0.82, 1280);
  const maxHeight = Math.min(viewportHeight * 0.60, 900);
  const scale = Math.min(1.5, maxWidth / rotatedWidth, maxHeight / rotatedHeight);
  return {
    imageWidth: width * scale,
    imageHeight: height * scale,
    frameWidth: rotatedWidth * scale,
    frameHeight: rotatedHeight * scale,
  };
}

async function readLimitedImage(response, type) {
  const claimedSize = Number(response.headers.get("content-length"));
  if (claimedSize > MAX_LOADING_IMAGE_BYTES) return null;

  let blob;
  if (response.body && response.body.getReader) {
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_LOADING_IMAGE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    blob = new Blob(chunks, { type });
  } else {
    blob = await response.blob();
    if (blob.size > MAX_LOADING_IMAGE_BYTES) return null;
  }

  const signature = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  return hasImageSignature(signature, type) ? blob : null;
}

async function initLoadingImage() {
  const filename = String(vpin.themeConfig?.loading_image || "").trim();
  if (!filename) return;

  const type = loadingImageType(filename);
  if (!type) {
    console.warn("Quick Spin loading image: use a simple PNG, JPG, WebP or GIF filename.");
    return;
  }

  try {
    const response = await fetch(`img/${encodeURIComponent(filename)}`, { cache: "no-store" });
    if (!response.ok) return;
    const blob = await readLimitedImage(response, type);
    if (!blob) {
      console.warn("Quick Spin loading image: file format or 3 MiB size limit failed.");
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const probe = new Image();
    probe.onload = () => {
      const width = probe.naturalWidth;
      const height = probe.naturalHeight;
      if (!isAllowedLoadingDimensions(width, height)) {
        URL.revokeObjectURL(objectUrl);
        console.warn("Quick Spin loading image: dimensions exceed the theme limit.");
        return;
      }

      const frame = document.querySelector(".custom-loading-frame");
      const art = document.querySelector(".custom-loading-image");
      const defaultLoading = document.querySelector(".default-loading");
      if (!frame || !art || !defaultLoading) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
      const rotation = loadingImageRotation(vpin.themeConfig?.loading_rotation);
      const fit = () => {
        const size = calculateLoadingImageFit(
          width, height, window.innerWidth, window.innerHeight, rotation
        );
        frame.style.width = `${size.frameWidth}px`;
        frame.style.height = `${size.frameHeight}px`;
        art.style.width = `${size.imageWidth}px`;
        art.style.height = `${size.imageHeight}px`;
        art.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      };
      fit();
      window.addEventListener("resize", fit);
      art.src = objectUrl;
      frame.hidden = false;
      defaultLoading.hidden = true;
      window.addEventListener("pagehide", () => URL.revokeObjectURL(objectUrl), { once: true });
    };
    probe.onerror = () => URL.revokeObjectURL(objectUrl);
    probe.src = objectUrl;
  } catch (error) {
    console.warn("Quick Spin loading image could not be read:", error);
  }
}
