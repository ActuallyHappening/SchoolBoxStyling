console.log("popup.js loaded");

function changeColour(colour) {
  console.log("changeColour called with colour: ", colour);
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {type: "setColour", colour,}, function(response) {
      console.log("[popup.js] got resp", response);
    });
  });
}

