/**
 * Input Handler
 * Handles joystick/keyboard input for table navigation
 */

function startAutoAdvanceTimer() {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
  }

  isAutoAdvancing = false;

  autoAdvanceTimer = setTimeout(() => {
    isAutoAdvancing = true;
    autoAdvance();
  }, AUTO_ADVANCE_INITIAL_DELAY);
}

function autoAdvance() {
  if (!isAutoAdvancing) return;

  currentTableIndex = moveTable(1);

  vpin.sendMessageToAllWindows({
    type: "TableIndexUpdate",
    index: currentTableIndex,
  });
  updateScreen();

  autoAdvanceTimer = setTimeout(() => {
    autoAdvance();
  }, AUTO_ADVANCE_INTERVAL);
}

function stopAutoAdvanceTimer() {
  if (autoAdvanceTimer !== null) {
    clearTimeout(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  isAutoAdvancing = false;
}

async function handleInput(input) {
  startAutoAdvanceTimer();

  switch (input) {
    case "joyleft":
      currentTableIndex = moveTable(-1);

      vpin.sendMessageToAllWindows({
        type: "TableIndexUpdate",
        index: currentTableIndex,
      });
      updateScreen();
      break;

    case "joyright":
          currentTableIndex = moveTable(1);

      vpin.sendMessageToAllWindows({
        type: "TableIndexUpdate",
        index: currentTableIndex,
      });
      updateScreen();
      break;

    case "joyselect":
      isGameRunning = true;
      if (typeof stopAutoAdvanceTimer === "function") {
        stopAutoAdvanceTimer();
      }
      vpin.sendMessageToAllWindowsIncSelf({ type: "TableLaunching" });
      cleanupAllMedia();
      fadeOut();

      await vpin.launchTable(currentTableIndex);
      rebuildTableOrder();
      isGameRunning = false;

      vpin.sendMessageToAllWindowsIncSelf({ type: "TableLaunchComplete" });
      fadeIn();
      updateScreen();
      if (typeof startAutoAdvanceTimer === "function") {
        startAutoAdvanceTimer();
      }
      break;

    case "joyback":
      // Handle back button if needed
      break;
  }
}
