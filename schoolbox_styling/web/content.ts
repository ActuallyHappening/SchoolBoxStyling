/**
 * Actions are serializable constructs that define how to update the DOM.
 *
 * In storage, an action (which contains the current value) are stored with the actions name as the key.
 *
 * Popup.ts can only send full actions to content.ts,
 * who manages storing it and updating the DOM according to the actions specifications.
 *
 * There is a known set of possible keys that actions can take,
 *
 * ## Setting the same key twice can be thought of as updating the current value
 * (unless changes to the actions specification exist).
 *
 * ## Examples:
 * popup.ts sends action to content.ts:
 * {}
 */
export const knownKeys = [
  "topBarColour",
  "leftBarColour",
  "rightBarColour",
  "mainSchoolBoxIconURL",
] as const;
export type KnownKeys = typeof knownKeys[number];

console.log("content.js loaded");

function queryMany(querySelector: string, callback: (elem: Node) => void) {
  const elements = document.querySelectorAll(querySelector);
  if (elements.length == 0) {
    console.warn(
      `Did query for '${querySelector}', but matched nothing.\nTry copy pasting this into your browser:\ndocument.querySelectedAll("${querySelector}")\nIf nothing is returned, you may have made a mistake with your query selector.\nRemember to split multiple selectors with commas, like 'nav-bar, #id, .class'`
    );
  }
  elements.forEach(callback);
}

/**
 * Keys used to find known values in storage.
 * This is simple a prefixed version of `KnownKeys`.
 */
type StorageKey = `betterSchoolBoxExtensionStorage-${KnownKeys}`;
/**
 * What is stored in storage.
 * This is no different to `Action` interface,
 * as the 'current' value is in `Action.storedValue`
 */
type StorageValue = Action;
function getFromStorage(
  itemName: KnownKeys,
  callback: (value: StorageValue) => void
) {
  chrome.storage.sync.get([_genStorageKey(itemName)], (items) => {
    const data = items[itemName];
    if (!data) {
      console.warn(
        `Retrieving item '${itemName}' from storage found nothing.\nIf no value for ${itemName} has ever been stored, this is expected.\nOtherwise, a typo in ${itemName} is likely the cause.`
      );
    }
    console.log(
      "Retrieved",
      data,
      "under key",
      itemName,
      "from synced local storage."
    );
    callback(data);
  });
}

function _genStorageKey(key: KnownKeys) {
  return `betterSchoolBoxExtensionStorage-${key}`;
}

function setToStorage(itemName: KnownKeys, value: StorageValue) {
  chrome.storage.sync.set({
    [_genStorageKey(itemName)]: value,
  });
}

interface EventPayload {
  type: KnownKeys;
  value: Action;
}
function listenForMessage(key: KnownKeys, callback: (value: Action) => void) {
  chrome.runtime.onMessage.addListener((msg, sender, response) => {
    if (msg?.type === key) {
      callback(msg.value);
    }
  });
}

/**
 *
 * @param {String} param the parameter, e.g. 'https://myimg.com'
 * @param {String} wrapper 'url($$$)', note use of `$$$` as placeholder for value
 * @returns The wrapper with value replaced in it
 */
function _evalValueWrapper(param: string, wrapper: string) {
  return wrapper.replace("$$$", param);
}

interface Action {
  /**
   * Which action this updates.
   */
  key: KnownKeys;

  querySelector: string;
  firstLevelProperty: "style" | "src";
  secondLevelProperty?: string;

  newValWrapper: `${string}$$$${string}`;

  currentValue: ParamPayload;
}

/**
 * Either css colour,
 * or url to image
 */
type ParamPayload = string;
function executeActionInScope(
  action: Action,
  scope: "update",
  param: ParamPayload
) {
  if (scope == "update") {
    // Update DOM in some way
    const {
      querySelector,
      firstLevelProperty,
      secondLevelProperty,
      newValWrapper,
    } = action;
    queryMany(querySelector, (element: Node) => {
      if (secondLevelProperty) {
        try {
          // @ts-ignore
          element[firstLevelProperty][secondLevelProperty] = _evalValueWrapper(
            param,
            newValWrapper
          );
        } catch (e) {
          console.error(
            "error caught which execute action",
            action,
            "in scope",
            scope,
            "with param",
            param,
            ";; Error:",
            e
          );
        }
      }
    });
  }
}

/**
 * Registers an action to appropriate event listeners.
 * This 'deserializes' it, basically.
 * @param action Action to register to appropriate event listeners
 */
function registerAction(action: Action) {
  const { key } = action;
  getFromStorage(key, (param) => {
    // initial load, trigger 'update'
    executeActionInScope(action, "update", param.storedValue);
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes[key].newValue) {
      // storageUpdated trigger update
      executeActionInScope(action, "update", changes[key].newValue);
    }
  });
  listenForMessage(key, (value) => {
    // messageReceived trigger update
    executeActionInScope(action, "update", value.value);
  });
}

{
  // When first loaded
  const elem = document.querySelectorAll(".tab-bar")[0];
  console.log("[content.js] [Initial load] Found element", elem);

  chrome.storage.sync.get(["savedColour"], (items) => {
    console.log("[content.js] [Initial load] Got items from storage", items);
    const savedColour = items.savedColour;
    if (savedColour) {
      console.log(
        "[content.js] [Initial load] Found saved colour",
        savedColour
      );
      elem.style.backgroundColor = savedColour;
    }
  });
}
{
  const elem = document.querySelectorAll("aside, #left-menu")[0];
  console.log("[content.js] [Initial load -left] Found element", elem);

  chrome.storage.sync.get(["savedColourLeftMenu"], (items) => {
    console.log(
      "[content.js] [Initial load-left] Got items from storage",
      items
    );
    const savedColour = items.savedColourLeftMenu;
    if (savedColour) {
      console.log(
        "[content.js] [Initial load-left] Found saved colour",
        savedColour
      );
      elem.style.backgroundColor = savedColour;
    }
  });
}
{
  const elem = document.querySelectorAll("a, [class='logo']")[0];
  console.log("[content.js] [Initial load -left] Found IMAGE", elem);

  chrome.storage.sync.get(["savedMainSchoolboxIcon"], (items) => {
    console.log(
      "[content.js] [Initial load-img] Got items from storage",
      items
    );
    const savedURL = items.savedMainSchoolboxIcon;
    if (savedURL) {
      console.log(
        "[content.js] [Initial load-img] Found saved colour",
        savedURL
      );
      elem.style.background = "url(" + savedURL + ") no-repeat center center";
    }
  });
}

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log(
    sender.tab
      ? "[content.js] from a content script:" + sender.tab.url
      : "[content.js] from the extension"
  );
  if (msg?.type === "setColour") {
    const elem = document.querySelectorAll(".tab-bar")[0];
    console.log("[content.js] Found element", elem);

    elem.style.backgroundColor = msg.colour;
    chrome.storage.sync.set({ savedColour: msg.colour });
    console.log(
      "[content.js] Set colour to",
      msg.colour,
      "and saved to storage"
    );

    response({ ...msg, status: "ok" });
  } else if (msg?.type === "setColourLeftMenu") {
    const elem = document.querySelectorAll("aside, #left-menu")[0];
    console.log("[content.js]-left Found element", elem);

    elem.style.backgroundColor = msg.colour;
    chrome.storage.sync.set({ savedColourLeftMenu: msg.colour });
    console.log(
      "[content.js]-left Set colour to",
      msg.colour,
      "and saved to storage"
    );

    response({ ...msg, status: "ok" });
  } else if (msg?.type === "setMainSchoolboxIcon") {
    const elem = document.querySelectorAll("a, [class='logo']")[0];
    console.log("[content.js]-img Found element", elem);

    elem.style.background = "url(" + msg.iconURL + ") no-repeat center center";
    chrome.storage.sync.set({ savedMainSchoolboxIcon: msg.iconURL });
    console.log(
      "[content.js]-img Set colour to",
      msg.iconURL,
      "and saved to storage"
    );

    response({ ...msg, status: "ok" });
  }
});
