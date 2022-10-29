
[
  ["firebase_core", "https://www.gstatic.com/firebasejs/9.11.0/firebase-app.js"],
  ["firebase_app_check", "https://www.gstatic.com/firebasejs/9.11.0/firebase-app-check.js"],
  ["firebase_remote_config", "https://www.gstatic.com/firebasejs/9.11.0/firebase-remote-config.js"],
  ["firebase_firestore", "https://www.gstatic.com/firebasejs/9.11.0/firebase-firestore.js"]
].forEach((b) => {
  window["ff_trigger_" + b[0]] = async (callback) => {
    callback(await import(b[1]));
  };
});