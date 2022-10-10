"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
console.log("popup.js loaded");
function sendNewValue(key, value) {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { key, value });
    });
}
