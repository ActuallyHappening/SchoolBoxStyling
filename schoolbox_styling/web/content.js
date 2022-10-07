console.log("content.js loaded");

{ // When first loaded
  const elem = document.querySelectorAll(".tab-bar")[0];
  console.log("[content.js] [Initial load] Found element", elem);

  chrome.storage.sync.get(["savedColour"], (items) => {
    console.log("[content.js] [Initial load] Got items from storage", items);
    if (item.savedColour) {
      console.log("[content.js] [Initial load] Found saved colour", item.savedColour);
      elem.style.backgroundColor = item.savedColour; 
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
    
  }
})