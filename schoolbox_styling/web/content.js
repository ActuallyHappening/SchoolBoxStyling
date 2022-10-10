console.log("content.js loaded");
console.log("content.js - Includes left")

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
}{
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
}{
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
  if (msg?.type === "setColour") {
    const elem = document.querySelectorAll(".tab-bar")[0];
    console.log("[content.js] Found element", elem);

    elem.style.backgroundColor = msg.colour;
    chrome.storage.sync.set({ savedColour: msg.colour });
    console.log("[content.js] Set colour to", msg.colour, "and saved to storage");

    response({ ...msg, status: "ok" });
    
  } else if (msg?.type === "setColourLeftMenu") {
    const elem = document.querySelectorAll("aside, #left-menu")[0];
    console.log("[content.js]-left Found element", elem);

    elem.style.backgroundColor = msg.colour;
    chrome.storage.sync.set({ savedColourLeftMenu: msg.colour });
    console.log("[content.js]-left Set colour to", msg.colour, "and saved to storage");

    response({ ...msg, status: "ok" });
  } else if (msg?.type === "setMainSchoolboxIcon") {
    const elem = document.querySelectorAll("a, [class='logo']")[0];
    console.log("[content.js]-img Found element", elem);

    elem.style.background = 'url(' + msg.iconURL + ') no-repeat center center';
    chrome.storage.sync.set({ savedMainSchoolboxIcon: msg.iconURL });
    console.log("[content.js]-img Set colour to", msg.iconURL, "and saved to storage");

    response({ ...msg, status: "ok" });
  }
})