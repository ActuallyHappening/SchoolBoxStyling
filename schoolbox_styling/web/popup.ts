console.log("popup.js loaded");

function changeTopBarColour(colour) {
  console.log("changeColour called with colour: ", colour);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "setColour", colour },
      function (response) {
        console.log("[popup.js] got resp", response);
      }
    );
  });
}

function changeLeftBarColour(colour) {
  try {
    console.log("-left changeColour called with colour: ", colour);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { type: "setColourLeftMenu", colour },
        function (response) {
          console.log("[popup.js]-left got resp", response);
        }
      );
    });
  } catch (e) {
    console.error("e", e);
  }
}

function changeMainSchoolboxIcon(iconURL) {
  console.log("changeMainSchoolboxIcon called with iconURL: ", iconURL);
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "setMainSchoolboxIcon", iconURL },
      function (response) {
        console.log("[popup.js] got resp", response);
      }
    );
  });
}
