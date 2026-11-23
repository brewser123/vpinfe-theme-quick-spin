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

function settingIsEnabled(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return !["false", "0", "no", "off"].includes(String(value).toLowerCase());
}

function parseGamepadButtonList(value) {
  return [...new Set(
    String(value ?? "")
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number)
      .filter((button) => Number.isInteger(button) && button >= 0 && button <= 63)
  )];
}

function buttonsMappedToAction(action) {
  return Object.entries(vpin.joyButtonMap || {})
    .filter(([, actions]) => Array.isArray(actions) && actions.includes(action))
    .map(([button]) => Number(button))
    .filter((button) => Number.isInteger(button));
}

function buildSortControlBindings() {
  return {
    flipperChord: settingIsEnabled(
      vpin.themeConfig?.sort_flipper_chord,
      true
    ),
    leftFlippers: buttonsMappedToAction("joyleft"),
    rightFlippers: buttonsMappedToAction("joyright"),
    gamepadButtons: parseGamepadButtonList(
      vpin.themeConfig?.sort_gamepad_button
    ),
  };
}

function currentGamepads() {
  if (typeof navigator.getGamepads !== "function") return [];
  return Array.from(navigator.getGamepads() || []).filter(Boolean);
}

function isButtonPressed(gamepad, button) {
  return Boolean(gamepad?.buttons?.[button]?.pressed);
}

function areFlipperSortButtonsPressed() {
  const bindings = sortControlBindings || buildSortControlBindings();
  if (
    !bindings.flipperChord ||
    !bindings.leftFlippers.length ||
    !bindings.rightFlippers.length
  ) {
    return false;
  }

  return currentGamepads().some((gamepad) =>
    bindings.leftFlippers.some((button) => isButtonPressed(gamepad, button)) &&
    bindings.rightFlippers.some((button) => isButtonPressed(gamepad, button))
  );
}

function isConfiguredSortGamepadButtonPressed() {
  const bindings = sortControlBindings || buildSortControlBindings();
  if (!bindings.gamepadButtons.length) return false;
  return currentGamepads().some((gamepad) =>
    bindings.gamepadButtons.some((button) => isButtonPressed(gamepad, button))
  );
}

function configuredSortKeyMatches(event) {
  const configured = String(vpin.themeConfig?.sort_keyboard_key ?? "s")
    .trim()
    .toLowerCase();
  if (!configured || configured === "none" || event.repeat) return false;

  const tokens = configured.split(/[\s,]+/).filter(Boolean);
  const pressed = [String(event.key || "").toLowerCase(), String(event.code || "").toLowerCase()];
  if (event.key === " ") pressed.push("space");
  return tokens.some((token) => pressed.includes(token));
}

function pollSortControl() {
  const inputEnabled = vpin.frontendInputEnabled !== false && !isGameRunning;
  const pressed = inputEnabled && (
    areFlipperSortButtonsPressed() ||
    isConfiguredSortGamepadButtonPressed()
  );

  if (pressed && !sortControlWasPressed) {
    sortControlWasPressed = true;
    startAutoAdvanceTimer();
    toggleSortMode();
  } else if (!pressed) {
    sortControlWasPressed = false;
  }

  sortControlFrame = requestAnimationFrame(pollSortControl);
}

function startSortControlWatcher() {
  sortControlBindings = buildSortControlBindings();
  const hasGamepadControl =
    sortControlBindings.gamepadButtons.length > 0 ||
    (
      sortControlBindings.flipperChord &&
      sortControlBindings.leftFlippers.length > 0 &&
      sortControlBindings.rightFlippers.length > 0
    );
  if (hasGamepadControl && sortControlFrame === null) {
    sortControlFrame = requestAnimationFrame(pollSortControl);
  }
}

async function handleInput(input) {
  startAutoAdvanceTimer();

  if (
    (input === "joyleft" || input === "joyright") &&
    areFlipperSortButtonsPressed()
  ) {
    return;
  }

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
      cleanupAllMedia();
      fadeOut();

      try {
        await vpin.launchTable(currentTableIndex);
      } finally {
        isGameRunning = false;
      }
      break;

    case "joyback":
      // Handle back button if needed
      break;
  }
}
