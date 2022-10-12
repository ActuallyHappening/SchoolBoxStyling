import { KnownKeys, ParamPayload, EventPayload } from "./content";
console.log("popup.js loaded");

function _sendNewValue(key: KnownKeys, value: ParamPayload) {
  if (!chrome.tabs) {
    console.warn("chrome.tabs is not available");
    return;
  }

  const payload: EventPayload = { key, newValue: value };
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id!, payload);
  });
}

function sendNewValue(key: KnownKeys, value: ParamPayload) {
  _sendNewValue(key, value);
}
