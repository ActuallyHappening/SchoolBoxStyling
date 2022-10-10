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
 * ## Runtime action registering is NOT supported, as removing event listeners is hard!
 *
 * ## Examples:
 * popup.ts sends action to content.ts:
 */
knownKeys = [
    "topBarColour",
    "leftBarColour",
    "rightBarColour",
    "mainSchoolBoxIconURL",
];
console.log("content.js loaded");
function queryMany(querySelector, callback) {
    const elements = document.querySelectorAll(querySelector);
    if (elements.length == 0) {
        console.warn(`Did query for '${querySelector}', but matched nothing.\nTry copy pasting this into your browser:\ndocument.querySelectedAll("${querySelector}")\nIf nothing is returned, you may have made a mistake with your query selector.\nRemember to split multiple selectors with commas, like 'nav-bar, #id, .class'`);
    }
    elements.forEach(callback);
}
function getFromStorage(itemName, callback) {
    chrome.storage.sync.get([_genStorageKey(itemName)], (items) => {
        const data = items[itemName];
        if (!data) {
            console.warn(`Retrieving item '${itemName}' from storage found nothing.\nIf no value for ${itemName} has ever been stored, this is expected.\nOtherwise, a typo in ${itemName} is likely the cause.`);
        }
        console.log("Retrieved", data, "under key", itemName, "from synced local storage.");
        callback(data);
    });
}
function _genStorageKey(key) {
    return `betterSchoolBoxExtensionStorage-${key}`;
}
function setToStorage(itemName, value) {
    chrome.storage.sync.set({
        [_genStorageKey(itemName)]: value,
    });
}
function listenForMessage(key, callback) {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        if (msg.key === key) {
            console.log("[listenForMessage] Received message for key", key, "with value", msg.newValue);
            callback(msg.newValue);
        }
    });
}
/**
 *
 * @param {String} param the parameter, e.g. 'https://myimg.com'
 * @param {String} wrapper 'url($$$)', note use of `$$$` as placeholder for value
 * @returns The wrapper with value replaced in it
 */
function _evalValueWrapper(param, wrapper) {
    return wrapper.replace("$$$", param);
}
function executeActionInScope(action, scope, param) {
    if (scope == "update") {
        // Update DOM in some way
        const { querySelector, firstLevelProperty, secondLevelProperty, newValWrapper, } = action;
        queryMany(querySelector, (element) => {
            if (secondLevelProperty) {
                try {
                    // @ts-ignore
                    element[firstLevelProperty][secondLevelProperty] = _evalValueWrapper(param, newValWrapper);
                }
                catch (e) {
                    console.error("error caught which execute action", action, "in scope", scope, "with param", param, ";; Error:", e);
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
function registerAction(action) {
    const { key } = action;
    getFromStorage(key, (newestValue) => {
        // initial load, trigger 'update'
        console.log("initial load, triggering 'update' for key", key, "and action", action);
        executeActionInScope(action, "update", newestValue);
    });
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && changes[key].newValue) {
            // storageUpdated trigger update
            console.log("Detected change in storage key", key, "and updating action", action, "with new value", changes[key].newValue);
            executeActionInScope(action, "update", changes[key].newValue);
        }
    });
    listenForMessage(key, (value) => {
        // messageReceived trigger update
        console.log("Detected message for key", key, "and updating action", action, "with new value", value);
        executeActionInScope(action, "update", value);
    });
}
const knownActionStatics = [
    {
        key: "topBarColour",
        querySelector: "nav.tab-bar",
        firstLevelProperty: "style",
        secondLevelProperty: "backgroundColor",
        newValWrapper: "$$$",
    },
    {
        key: "leftBarColour",
        querySelector: "aside#left-menu",
        firstLevelProperty: "style",
        secondLevelProperty: "backgroundColor",
        newValWrapper: "$$$",
    },
    {
        key: "mainSchoolBoxIconURL",
        querySelector: "a.logo",
        firstLevelProperty: "style",
        secondLevelProperty: "background",
        newValWrapper: "url($$$) center center no-repeat",
    },
];
knownActionStatics.forEach(registerAction);
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log("[debug all] Received message", msg, "from sender", sender);
});
// #region dead
// {
//   // When first loaded
//   const elem = document.querySelectorAll(".tab-bar")[0];
//   console.log("[content.js] [Initial load] Found element", elem);
//   chrome.storage.sync.get(["savedColour"], (items) => {
//     console.log("[content.js] [Initial load] Got items from storage", items);
//     const savedColour = items.savedColour;
//     if (savedColour) {
//       console.log(
//         "[content.js] [Initial load] Found saved colour",
//         savedColour
//       );
//       elem.style.backgroundColor = savedColour;
//     }
//   });
// }
// {
//   const elem = document.querySelectorAll("aside, #left-menu")[0];
//   console.log("[content.js] [Initial load -left] Found element", elem);
//   chrome.storage.sync.get(["savedColourLeftMenu"], (items) => {
//     console.log(
//       "[content.js] [Initial load-left] Got items from storage",
//       items
//     );
//     const savedColour = items.savedColourLeftMenu;
//     if (savedColour) {
//       console.log(
//         "[content.js] [Initial load-left] Found saved colour",
//         savedColour
//       );
//       elem.style.backgroundColor = savedColour;
//     }
//   });
// }
// {
//   const elem = document.querySelectorAll("a, [class='logo']")[0];
//   console.log("[content.js] [Initial load -left] Found IMAGE", elem);
//   chrome.storage.sync.get(["savedMainSchoolboxIcon"], (items) => {
//     console.log(
//       "[content.js] [Initial load-img] Got items from storage",
//       items
//     );
//     const savedURL = items.savedMainSchoolboxIcon;
//     if (savedURL) {
//       console.log(
//         "[content.js] [Initial load-img] Found saved colour",
//         savedURL
//       );
//       elem.style.background = "url(" + savedURL + ") no-repeat center center";
//     }
//   });
// }
// chrome.runtime.onMessage.addListener((msg, sender, response) => {
//   console.log(
//     sender.tab
//       ? "[content.js] from a content script:" + sender.tab.url
//       : "[content.js] from the extension"
//   );
//   if (msg?.type === "setColour") {
//     const elem = document.querySelectorAll(".tab-bar")[0];
//     console.log("[content.js] Found element", elem);
//     elem.style.backgroundColor = msg.colour;
//     chrome.storage.sync.set({ savedColour: msg.colour });
//     console.log(
//       "[content.js] Set colour to",
//       msg.colour,
//       "and saved to storage"
//     );
//     response({ ...msg, status: "ok" });
//   } else if (msg?.type === "setColourLeftMenu") {
//     const elem = document.querySelectorAll("aside, #left-menu")[0];
//     console.log("[content.js]-left Found element", elem);
//     elem.style.backgroundColor = msg.colour;
//     chrome.storage.sync.set({ savedColourLeftMenu: msg.colour });
//     console.log(
//       "[content.js]-left Set colour to",
//       msg.colour,
//       "and saved to storage"
//     );
//     response({ ...msg, status: "ok" });
//   } else if (msg?.type === "setMainSchoolboxIcon") {
//     const elem = document.querySelectorAll("a, [class='logo']")[0];
//     console.log("[content.js]-img Found element", elem);
//     elem.style.background = "url(" + msg.iconURL + ") no-repeat center center";
//     chrome.storage.sync.set({ savedMainSchoolboxIcon: msg.iconURL });
//     console.log(
//       "[content.js]-img Set colour to",
//       msg.iconURL,
//       "and saved to storage"
//     );
//     response({ ...msg, status: "ok" });
//   }
// });
// #endregion
//# sourceMappingURL=content.js.map