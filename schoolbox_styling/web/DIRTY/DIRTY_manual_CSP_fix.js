import * as firebase_app from "./firebase-app-v9.11"
import * as firebase_app_check from "./firebase-app-check-v9.11"
import * as firebase_remote_config from "./firebase-remote-config-v9.11"
import * as firebase_firestore from "./firebase-firestore-v9.11"

console.log("DIRTY_manual_CSP_fix.js loaded");

// [
//   ["firebase_core", firebase_app],
//   ["firebase_app_check", firebase_app_check],
//   ["firebase_remote_config", firebase_remote_config],
//   ["firebase_firestore", firebase_firestore]
// ].forEach((b) => {
[
  ["firebase_core", "./firebase-app-v9.11"],
  ["firebase_app_check", "./firebase-app-check-v9.11"],
  ["firebase_remote_config", "./firebase-remote-config-v9.11"],
  ["firebase_firestore", "./firebase-firestore-v9.11"]
].forEach(([name, url]) => {
  console.log("ff_trigger_" + name + " registered");
  window["ff_trigger_" + name] = async (callback) => {
    callback(import(url));
  };
});