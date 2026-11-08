/**
 * Quick Spin Theme - Main Entry Point
 * 3-Screen Cabinet Edition
 */

const vpin = new VPinFECore();
vpin.init();
window.vpin = vpin;

window.receiveEvent = receiveEvent;

vpin.ready.then(async () => {
  initLoadingImage();
  const urlParams = new URLSearchParams(window.location.search);
  const overrideStr = urlParams.get("override");
  if (overrideStr) {
    const parts = overrideStr.split(",").map((v) => parseInt(v.trim()));
    const [x, y, width, height] = parts;
    windowOverride = { x, y, width, height };
  }

  await vpin.call("get_my_window_name").then((result) => {
    windowName = result;
  });

  if (windowName === "table") {
    vpin.registerInputHandler(handleInput);
    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "s" && !event.repeat) {
        toggleSortMode();
      }
    });
    await applyTableLayout();
    window.addEventListener("resize", () => {
      applyTableLayout().then(() => {
        updateTableWindowCarousel();
        updateTableWindowHeroMedia();
      });
    });
  }

  const initializeDisplay = async () => {
    if (!vpin.tableData || vpin.tableData.length === 0) {
      return false;
    }

    currentTableIndex = vpin.getCurrentTableIndex();
    rebuildTableOrder();

    if (windowName === "table") {
      updateScreen();
      startAutoAdvanceTimer();

      setTimeout(() => {
        vpin.sendMessageToAllWindows({
          type: "TableIndexUpdate",
          index: currentTableIndex,
        });
      }, 500);
    } else {
      // BG/DMD windows can finish loading after the table window's one-time
      // broadcast.  Render their current table immediately instead of
      // remaining black until the carousel moves.
      updateScreen();
    }

    return true;
  };

  const initialized = await initializeDisplay();

  if (!initialized) {
    const checkData = setInterval(async () => {
      const success = await initializeDisplay();
      if (success) {
        clearInterval(checkData);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkData);
    }, 10000);
  }
});
