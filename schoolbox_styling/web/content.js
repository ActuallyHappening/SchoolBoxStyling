console.log("content.js loaded");

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log(sender.tab ?
                "[content.js] from a content script:" + sender.tab.url :
    "[content.js] from the extension");
  if (msg?.type === "setColour") {
    const elem = document.querySelectorAll(".tab-bar")[0];
    console.log("[content.js] Found element", elem);
    elem.style.backgroundColor = msg.colour;
    response({...msg, status: "ok"});
  }
})