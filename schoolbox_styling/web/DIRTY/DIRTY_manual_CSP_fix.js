import * as firebase_app from "./firebase-app-v9.11"
import * as firebase_app_check from "./firebase-app-check-v9.11"
import * as firebase_remote_config from "./firebase-remote-config-v9.11"
import * as firebase_firestore from "./firebase-firestore-v9.11"

[
  ["firebase_core", firebase_app],
  ["firebase_app_check", firebase_app_check],
  ["firebase_remote_config", firebase_remote_config],
  ["firebase_firestore", firebase_firestore]
].forEach((b) => {
  window["ff_trigger_" + b[0]] = async (callback) => {
    callback(b[1]);
  };
});