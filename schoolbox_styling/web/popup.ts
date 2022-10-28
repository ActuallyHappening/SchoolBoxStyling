import { KnownKeys, UserRequest } from "./content";
console.log("popup.js loaded");

function _sendNewValue(key: KnownKeys, value: UserRequest) {
  if (!chrome.tabs) {
    console.warn("chrome.tabs is not available, likely in dev environment");
    return;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id!, value);
  });
}

function sendNewValue(key: KnownKeys, value: "RESET" | string) {
  let request: UserRequest;
  if (value === "RESET") {
    request = { __is_user_request: true, key, do: "RESET" };
  } else {
    request = { __is_user_request: true, key, do: { newAssignedValue: value } };
  }
  console.log(`Sending UserRequest`, request);

  _sendNewValue(key, request);
}

function setNewSize(sizeX: number, sizeY: number) {
  const html = document.querySelector("html");
  if (!html) {
    throw new Error("html element not found");
  }
  html.style.width = `${sizeX}px`;
  html.style.height = `${sizeY}px`;
}