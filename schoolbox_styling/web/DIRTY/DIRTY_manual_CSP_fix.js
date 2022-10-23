
[
  ["firebase_core", "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js"],
  ["firebase_core", "https://www.gstatic.com/firebasejs/9.9.0/firebase-app.js"],
  ["app_check", "https://www.gstatic.com/firebasejs/9.9.0/firebase-remote-config.js"]
].forEach((b) => {
  window["ff_trigger_" + b[0]] = async (callback) => {
    callback(await import(b[1]));
  };
});