/**
 * Event Handler
 * Handles VPinFE system events
 */

async function receiveEvent(message) {
  vpin.call("console_out", message);

  await vpin.handleEvent(message);

  switch (message.type) {
    case "TableIndexUpdate":
      currentTableIndex = message.index;
      updateScreen();
      break;

    case "TableLaunching":
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      fadeOut();
      if (windowName !== "table") {
        cleanupAllMedia();
      }
      break;

    case "TableRunning":
      fadeIn();
      break;

    case "TableLaunchComplete":
      rebuildTableOrder();
      fadeIn();
      updateScreen();
      if (windowName === "table" && typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      break;

    case "RemoteLaunching":
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      if (windowName === "table") {
        showRemoteLaunchOverlay(message.table_name);
      }
      cleanupAllMedia();
      fadeOut();
      break;

    case "RemoteLaunchComplete":
      if (windowName === "table") {
        hideRemoteLaunchOverlay();
      }
      rebuildTableOrder();
      fadeIn();
      updateScreen();
      if (typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      break;

    case "TableDataChange":
      rebuildTableOrder();
      currentTableIndex = message.index;
      updateScreen();
      break;
  }
}
