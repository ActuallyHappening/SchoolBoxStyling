"use strict";
// Replaced by macro.py
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
const knownKeys = [
    "topBarColour",
    "leftBarColour",
    "rightBarColour",
    "mainSchoolBoxIconURL",
    "deleteIMGSrc",
    "bodyBackgroundColour",
    "timetablePeriodHeaders",
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
    const storageKey = _genStorageKey(itemName);
    chrome.storage.sync.get([storageKey], (items) => {
        const data = items[storageKey];
        if (!data) {
            console.warn(`Retrieving item '${itemName}' from storage found nothing.\nIf no value for ${itemName} has ever been stored, this is expected.\nOtherwise, a typo in ${itemName} is likely the cause.\n Raw storage key: ${storageKey}`);
        }
        console.log("Retrieved", data, "under key", itemName, "from synced local storage.");
        callback(data);
    });
}
function _genStorageKey(key) {
    return `betterSchoolBoxExtensionStorage-${key}`;
}
function setToStorage(itemName, value) {
    const storageKey = _genStorageKey(itemName);
    console.log("Setting", value, "under key", storageKey, "in synced local storage.");
    chrome.storage.sync.set({
        [storageKey]: value,
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
            else {
                try {
                    // @ts-ignore
                    element[firstLevelProperty] = _evalValueWrapper(param, newValWrapper);
                    if (action.key == "deleteIMGSrc") {
                        console.warn("DELETE IMG SRC", "element", element, "firstLevelProperty", firstLevelProperty, "secondLevelProperty", secondLevelProperty, "newValWrapper", newValWrapper, "param", param);
                    }
                }
                catch (e) {
                    console.error("error caught which execute action", action, "in scope", scope, "with param", param, ";; Error:", e);
                }
            }
        });
    }
    else if (scope == "delete") {
        // Delete DOM in some way
        const { querySelector } = action;
        queryMany(querySelector, (element) => {
            var _a;
            (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
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
        if (!newestValue || newestValue == "empty") {
            if (action.defaultValue) {
                console.log("Loading default value for", key, "which is", action.defaultValue);
                executeActionInScope(action, action.defaultValue == "DELETE" ? "delete" : "update", action.defaultValue);
                return;
            }
        }
        console.log("initial load, triggering 'update' for key", key, "and action", action, "with newest value", newestValue);
        executeActionInScope(action, "update", newestValue);
    });
    chrome.storage.onChanged.addListener((changes, areaName) => {
        console.log("storage changed", changes, areaName);
        const keyChanges = changes[_genStorageKey(key)];
        if (areaName === "sync" && (keyChanges === null || keyChanges === void 0 ? void 0 : keyChanges.newValue)) {
            // storageUpdated trigger update
            console.log("[registered onChanged listener] Detected change in storage key", key, "and enacting action in scope", action, "with new value", keyChanges.newValue);
            executeActionInScope(action, "update", keyChanges.newValue);
        }
    });
    listenForMessage(key, (value) => {
        // messageReceived trigger update
        console.log("Detected message for key", key, "and updating action", action, "with new value", value);
        setToStorage(key, value); // Should trigger update
        // executeActionInScope(action, "update", value);
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
        querySelector: 'a.logo, img[alt="Emmanuel College"]',
        firstLevelProperty: "style",
        secondLevelProperty: "background",
        newValWrapper: "url($$$) center center / contain no-repeat",
    },
    {
        key: "deleteIMGSrc",
        querySelector: 'img[src][alt="Emmanuel College"]',
        firstLevelProperty: "srcset",
        newValWrapper: "$$$",
        defaultValue: "DELETE",
    },
    {
        key: "bodyBackgroundColour",
        querySelector: "table.timetable[data-timetable]>thead>tr>th",
        firstLevelProperty: "style",
        secondLevelProperty: "backgroundColor",
        newValWrapper: "$$$",
    },
    {
        key: "timetablePeriodHeaders",
        querySelector: "body",
        firstLevelProperty: "style",
        secondLevelProperty: "backgroundColor",
        newValWrapper: "$$$",
    },
];
knownActionStatics.forEach(registerAction);
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log("[debug all] Received message", msg, "from sender", sender);
});
