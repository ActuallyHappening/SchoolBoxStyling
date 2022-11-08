// ignore: avoid_web_libraries_in_flutter
import 'dart:js' as js;

import 'package:flutter/material.dart';

import 'constants.dart';

enum PossibleActions {
  /// Requests content.ts to reset the given key
  reset,

  /// Assign a new value to a known key.
  newAssignedValue,
}

void sendNewValue({
  required KnownKey key,
  required PossibleActions action,
  String? value,
}) {
  // Handle the allBackgrounds key specially.
  if (key == KnownKey.allBackgrounds) {
    // Call every other key's reset function.

    // ignore: avoid_print
    print("[js_integration dart] Handling all background key ...");
    for (var newKey in KnownKey.values) {
      if (newKey != KnownKey.allBackgrounds) {
        sendNewValue(key: newKey, action: action, value: value);
      } else {
        // ignore: avoid_print
        print("[js_integration dart] Skipping allBackgrounds key");
      }
    }
    return;
  }

  String userRequest;
  if (action == PossibleActions.reset) {
    userRequest = 'RESET';
  } else {
    userRequest = value!;
  }
  // ignore: avoid_print
  print('Sending $userRequest to $key');
  try {
    js.context.callMethod("sendNewValue", [key.key, userRequest]);
  } catch (e) {
    // ignore: avoid_print
    print('[js_integration] [dart] Error sending $userRequest to $key: $e');
  }
}

String toCSSColour(Color colour) {
  return "rgba(${colour.red}, ${colour.green}, ${colour.blue}, ${colour.alpha})";
}

enum BackgroundURLOptions {
  smallTiled,

  smallContained,

  largeStatic,
  largeScroll,
}

extension BackgroundURLJsOptionsExt on BackgroundURLOptions {
  String get description => {
        BackgroundURLOptions.smallTiled:
            "Small tiled: image is repeated but small",
        BackgroundURLOptions.largeStatic:
            "Static: image is scaled up but stays still",
        BackgroundURLOptions.largeScroll:
            "Scrollable: image is scale up and scrollable",
        BackgroundURLOptions.smallContained:
            "Small contained: image fits in smaller spaces",
      }[this]!;

  String get cssSuffix => {
        BackgroundURLOptions.smallTiled: "0%",
        BackgroundURLOptions.largeStatic: "0% 0%/cover fixed",
        BackgroundURLOptions.largeScroll: " 0% 0%/cover",
        BackgroundURLOptions.smallContained: "0% 0%/contain",
      }[this]!;
}

/// Specifies what kind of Key is being used.
/// * background must be cssPrefixed
/// * text can only be text
/// * multi is used to specify many keys at once
enum KnownKeyType { background, text, multi }

/// Get the type of key
extension KeyType on KnownKey {
  KnownKeyType get type => {
        KnownKey.topBar: KnownKeyType.background,
        KnownKey.leftBar: KnownKeyType.background,
        KnownKey.background: KnownKeyType.background,
        KnownKey.timetableHeaders: KnownKeyType.background,
        KnownKey.iconNotifications: KnownKeyType.background,
        KnownKey.allBackgrounds: KnownKeyType.multi,
        // KnownKey.nameText: KnownKeyType.text,
      }[this]!;

  /// Returns true if type is background or text
  /// Returns false if type is multi
  bool get canSend => type != KnownKeyType.multi;
}

extension KeySendValue on KnownKey {
  void send({required String value, bool reset = false}) {
    if (!canSend) {
      throw Exception("Cannot send value to key $this");
      // return;
    }
    sendNewValue(
      value: value,
      key: this,
      action: reset ? PossibleActions.reset : PossibleActions.newAssignedValue,
    );
  }

  void reset() {
    sendNewValue(key: this, action: PossibleActions.reset);
  }

  void sendColour(Color colour) {
    send(value: toCSSColour(colour));
  }

  void sendBackgroundURL(
      {required String url,
      BackgroundURLOptions option = BackgroundURLOptions.smallContained}) {
    send(value: "url($url) ${option.cssSuffix}");
  }
}

void setNewSize(int x, int y) {
  debugPrint("Setting new size to $x, $y");
  js.context.callMethod("setNewSize", [x, y]);
}
