"use strict";
console.log("content.js loaded");
function queryMany(querySelector, callback) {
    const elements = document.querySelectorAll(querySelector);
    if (elements.length == 0) {
        console.warn(`Did query for '${querySelector}', but matched nothing.\nTry copy pasting this into your browser:\ndocument.querySelectedAll("${querySelector}")\nIf nothing is returned, you may have made a mistake with your query selector.\nRemember to split multiple selectors with commas, like 'nav-bar, #id, .class'`);
    }
    elements.forEach(callback);
}
function getFromStorage(itemName, callback) {
    chrome.storage.sync.get([itemName], (items) => {
        const data = items[itemName];
        if (!data) {
            console.warn(`Retrieving item '${itemName}' from storage found nothing.\nIf no value for ${itemName} has ever been stored, this is expected.\nOtherwise, a typo in ${itemName} is likely the cause.`);
        }
        console.log("Retrieved", data, "under key", itemName, "from synced local storage.");
        callback(data);
    });
}
function setToStorage(itemName, value) {
    chrome.storage.sync.set({ [itemName]: value });
}
function listenForMessage(messageType, callback) {
    chrome.runtime.onMessage.addListener((msg, sender, response) => {
        if ((msg === null || msg === void 0 ? void 0 : msg.type) === messageType) {
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
function _evalValueWrapper(param, wrapper) {
    return wrapper.replace("$$$", param);
}
function executeActionInScope(action, scope, param) {
    if (scope == "update") {
        // Update DOM in some way
        const { querySelector, firstLevelProperty, secondLevelProperty, newValWrapper } = action;
        queryMany(querySelector, (element) => {
            if (secondLevelProperty) {
                element[firstLevelProperty][secondLevelProperty] = _evalValueWrapper(param, newValWrapper);
            }
        });
    }
}
function registerAction(action) {
    const { key } = action;
    getFromStorage(key, (param) => {
        // initial load, trigger 'update'
        executeActionInScope(action, "update", param);
    });
    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "sync" && changes[key]) {
            // storageUpdated trigger update
            executeActionInScope(action, "update", changes[key].newValue);
        }
    });
    listenForMessage(key, (value) => {
        // messageReceived trigger update
        executeActionInScope(action, "update", value.value);
    });
}
{ // When first loaded
    const elem = document.querySelectorAll(".tab-bar")[0];
    console.log("[content.js] [Initial load] Found element", elem);
    chrome.storage.sync.get(["savedColour"], (items) => {
        console.log("[content.js] [Initial load] Got items from storage", items);
        const savedColour = items.savedColour;
        if (savedColour) {
            console.log("[content.js] [Initial load] Found saved colour", savedColour);
            elem.style.backgroundColor = savedColour;
        }
    });
}
{
    const elem = document.querySelectorAll("aside, #left-menu")[0];
    console.log("[content.js] [Initial load -left] Found element", elem);
    chrome.storage.sync.get(["savedColourLeftMenu"], (items) => {
        console.log("[content.js] [Initial load-left] Got items from storage", items);
        const savedColour = items.savedColourLeftMenu;
        if (savedColour) {
            console.log("[content.js] [Initial load-left] Found saved colour", savedColour);
            elem.style.backgroundColor = savedColour;
        }
    });
}
{
    const elem = document.querySelectorAll("a, [class='logo']")[0];
    console.log("[content.js] [Initial load -left] Found IMAGE", elem);
    chrome.storage.sync.get(["savedMainSchoolboxIcon"], (items) => {
        console.log("[content.js] [Initial load-img] Got items from storage", items);
        const savedURL = items.savedMainSchoolboxIcon;
        if (savedURL) {
            console.log("[content.js] [Initial load-img] Found saved colour", savedURL);
            elem.style.background = 'url(' + savedURL + ') no-repeat center center';
        }
    });
}
chrome.runtime.onMessage.addListener((msg, sender, response) => {
    console.log(sender.tab ?
        "[content.js] from a content script:" + sender.tab.url :
        "[content.js] from the extension");
    if ((msg === null || msg === void 0 ? void 0 : msg.type) === "setColour") {
        const elem = document.querySelectorAll(".tab-bar")[0];
        console.log("[content.js] Found element", elem);
        elem.style.backgroundColor = msg.colour;
        chrome.storage.sync.set({ savedColour: msg.colour });
        console.log("[content.js] Set colour to", msg.colour, "and saved to storage");
        response(Object.assign(Object.assign({}, msg), { status: "ok" }));
    }
    else if ((msg === null || msg === void 0 ? void 0 : msg.type) === "setColourLeftMenu") {
        const elem = document.querySelectorAll("aside, #left-menu")[0];
        console.log("[content.js]-left Found element", elem);
        elem.style.backgroundColor = msg.colour;
        chrome.storage.sync.set({ savedColourLeftMenu: msg.colour });
        console.log("[content.js]-left Set colour to", msg.colour, "and saved to storage");
        response(Object.assign(Object.assign({}, msg), { status: "ok" }));
    }
    else if ((msg === null || msg === void 0 ? void 0 : msg.type) === "setMainSchoolboxIcon") {
        const elem = document.querySelectorAll("a, [class='logo']")[0];
        console.log("[content.js]-img Found element", elem);
        elem.style.background = 'url(' + msg.iconURL + ') no-repeat center center';
        chrome.storage.sync.set({ savedMainSchoolboxIcon: msg.iconURL });
        console.log("[content.js]-img Set colour to", msg.iconURL, "and saved to storage");
        response(Object.assign(Object.assign({}, msg), { status: "ok" }));
    }
});
