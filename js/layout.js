/**
 * Layout Manager
 * Handles screen rotation and scaling for table window
 */

function normalizeWheelOrientation(value) {
  return String(value || "").toLowerCase() === "horizontal"
    ? "horizontal"
    : "vertical";
}

function normalizeQuarterTurn(value, fallback = 0) {
  const parsed = Number(value);
  const normalized = ((parsed % 360) + 360) % 360;
  return [0, 90, 180, 270].includes(normalized) ? normalized : fallback;
}

function resolveWheelMountRotation(value, cabMode, orientation, vpinRotation) {
  if (String(value ?? "auto").toLowerCase() !== "auto") {
    return normalizeQuarterTurn(value);
  }

  // Quick Spin's original cabinet target uses a landscape framebuffer on a
  // playfield panel mounted clockwise. VPinFE reports rotation 0 there, so
  // compensate in the theme without changing VPX or the operating system.
  return cabMode && orientation === "landscape" && vpinRotation === 0 ? 90 : 0;
}

function resolveWheelLayout(orientation, rotationDegrees) {
  const physicalOrientation = normalizeWheelOrientation(orientation);
  const rotation = ((Number(rotationDegrees) % 360) + 360) % 360;
  const layouts = {
    0: {
      vertical: { axis: "column", edge: "right" },
      horizontal: { axis: "row", edge: "bottom" },
    },
    90: {
      vertical: { axis: "row", edge: "top" },
      horizontal: { axis: "column", edge: "right" },
    },
    180: {
      vertical: { axis: "column", edge: "left" },
      horizontal: { axis: "row", edge: "top" },
    },
    270: {
      vertical: { axis: "row", edge: "bottom" },
      horizontal: { axis: "column", edge: "left" },
    },
  };
  if (layouts[rotation]) {
    return layouts[rotation][physicalOrientation];
  }
  return layouts[0][physicalOrientation];
}

function applyWheelLayoutClasses(rotationDegrees) {
  wheelOrientation = normalizeWheelOrientation(
    vpin.themeConfig?.wheel_orientation
  );
  const layout = resolveWheelLayout(wheelOrientation, rotationDegrees);
  document.body.classList.toggle(
    "wheel-orientation-vertical",
    wheelOrientation === "vertical"
  );
  document.body.classList.toggle(
    "wheel-orientation-horizontal",
    wheelOrientation === "horizontal"
  );
  document.body.classList.toggle("wheel-axis-row", layout.axis === "row");
  document.body.classList.toggle("wheel-axis-column", layout.axis === "column");
  document.body.classList.toggle("wheel-edge-top", layout.edge === "top");
  document.body.classList.toggle("wheel-edge-left", layout.edge === "left");
  document.body.classList.toggle("wheel-edge-right", layout.edge === "right");
  document.body.classList.toggle("wheel-edge-bottom", layout.edge === "bottom");
}

async function applyTableLayout() {
  if (windowName !== "table") return;

  const screen = document.getElementById("tableScreen");
  const overlayRoot = document.getElementById("overlay-root");
  if (!screen) return;

  const cabMode = await vpin.call("get_cab_mode");
  const rotationDegree = await vpin.call("get_table_rotation");
  const orientation = String(
    (await vpin.call("get_table_orientation")) || ""
  ).toLowerCase();
  tableRotationDegrees = rotationDegree;
  const normalized = ((rotationDegree % 360) + 360) % 360;
  const swapAxes = normalized === 90 || normalized === 270;
  const mountRotation = resolveWheelMountRotation(
    vpin.themeConfig?.wheel_mount_rotation,
    Boolean(cabMode),
    orientation,
    normalized
  );
  const wheelLayoutRotation = (normalized + mountRotation) % 360;
  const wheelSwapAxes =
    wheelLayoutRotation === 90 || wheelLayoutRotation === 270;
  // Portrait display pre-rotated by the OS: the window is already portrait
  // and rotation is 0, so lay out portrait natively without rotating.
  isNativePortrait = orientation === "portrait" && normalized === 0;
  isTablePortrait = swapAxes || isNativePortrait;
  applyWheelLayoutClasses(wheelLayoutRotation);
  document.body.classList.toggle("table-surface-rotated", wheelSwapAxes);
  document.body.style.setProperty(
    "--quick-spin-counter-rotation",
    `${-wheelLayoutRotation}deg`
  );

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const baseWidth = isTablePortrait ? 1080 : 1920;
  const baseHeight = isTablePortrait ? 1920 : 1080;
  const scale = swapAxes
    ? Math.min(vw / baseHeight, vh / baseWidth)
    : Math.min(vw / baseWidth, vh / baseHeight);

  screen.style.width = `${baseWidth}px`;
  screen.style.height = `${baseHeight}px`;
  screen.style.transform =
    rotationDegree !== 0
      ? `rotate(${rotationDegree}deg) scale(${scale})`
      : `scale(${scale})`;
  screen.style.visibility = "visible";

  if (overlayRoot) {
    if (rotationDegree !== 0) {
      overlayRoot.style.width = `${baseWidth}px`;
      overlayRoot.style.height = `${baseHeight}px`;
      overlayRoot.style.top = "50%";
      overlayRoot.style.left = "50%";
      overlayRoot.style.transform = `translate(-50%, -50%) rotate(${rotationDegree}deg) scale(${scale})`;
    } else {
      overlayRoot.style.width = "100vw";
      overlayRoot.style.height = "100vh";
      overlayRoot.style.top = "0";
      overlayRoot.style.left = "0";
      overlayRoot.style.transform = "none";
    }
  }

  // Use landscape class for landscape mode, portrait is the default
  document.body.classList.toggle("table-screen-landscape", !isTablePortrait);
  document.body.classList.toggle("table-screen-portrait", isTablePortrait);
  document.body.classList.toggle("table-screen-cab", Boolean(cabMode));
}
