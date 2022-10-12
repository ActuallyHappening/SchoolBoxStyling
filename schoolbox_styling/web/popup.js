"use strict";
// Replaced by macro.py
console.log("popup.js loaded");
const previousTime = Date.now();
function sendNewValue(key, value) {
    if (!chrome.tabs) {
        console.warn("chrome.tabs is not available");
        return;
    }
    // Check that have not already sent message in the last 100ms
    if (Date.now() - previousTime < 100) {
        console.log("Not sending message, too soon. Difference:", Date.now() - previousTime);
        return;
    }
    const payload = { key, newValue: value };
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, payload);
    });
}
