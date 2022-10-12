"use strict";
// Replaced by macro.py
console.log("popup.js loaded");
function sendNewValue(key, value) {
    if (!chrome.tabs) {
        console.warn("chrome.tabs is not available");
        return;
    }
    const payload = { key, newValue: value };
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, payload);
    });
}
