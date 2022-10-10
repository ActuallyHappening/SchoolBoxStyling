import { KnownKeys, ParamPayload } from "./content";
console.log("popup.js loaded");

function sendNewValue(key: KnownKeys, value: ParamPayload) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id!, { key, value });
  });
}
