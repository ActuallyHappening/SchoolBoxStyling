"use strict";
// Replaced by macro.py
console.log("popup.js loaded");
function _sendNewValue(key, value) {
    if (!chrome.tabs) {
        console.warn("chrome.tabs is not available, likely in dev environment");
        return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, value);
    });
}
function sendNewValue(key, value) {
    let request;
    if (value === "RESET") {
        request = { __is_user_request: true, key, do: "RESET" };
    }
    else {
        request = { __is_user_request: true, key, do: { newAssignedValue: value } };
    }
    console.log(`Sending UserRequest`, request);
    _sendNewValue(key, request);
}
// @ts-ignore
window.sendNewValue = sendNewValue;
//# sourceMappingURL=popup.js.map