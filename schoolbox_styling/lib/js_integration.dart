// ignore: avoid_web_libraries_in_flutter
import 'dart:js' as js;
import 'dart:ui';

import 'constants.dart';

enum PossibleActions {
  reset,

  /// Assign a new value to a known key.
  newAssignedValue,
}

void sendNewValue({
  required KnownKey key,
  required PossibleActions action,
  String? value,
}) {
  String userRequest;
  if (action == PossibleActions.reset) {
    userRequest = 'RESET';
  } else {
    userRequest = value!;
  }
  // ignore: avoid_print
  print('Sending $userRequest to $key');
  js.context.callMethod("sendNewValue", [key.key, userRequest]);
}

String toCSSColour(Color colour) {
  return "rgba(${colour.red}, ${colour.green}, ${colour.blue}, ${colour.alpha})";
}

enum BackgroundURLOptions {
  smallTiled,
  largeStatic,
  largeScroll,
}

extension BackgroundURLOptionsExt on BackgroundURLOptions {
  String get description => {
        BackgroundURLOptions.smallTiled:
            "Small tiled: image is repeated but small",
        BackgroundURLOptions.largeStatic:
            "Static: image is scaled up but stays still",
        BackgroundURLOptions.largeScroll:
            "Scrollable: image is scale up and scrollable",
      }[this]!;

  String get cssSuffix => {
        BackgroundURLOptions.smallTiled: "",
        BackgroundURLOptions.largeStatic: "0% 0%/cover fixed",
        BackgroundURLOptions.largeScroll: " 0% 0%/cover",
      }[this]!;
}

extension KeySendValue on KnownKey {
  void send({required String value, bool reset = false}) {
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
      BackgroundURLOptions option = BackgroundURLOptions.largeStatic}) {
    send(value: "url($url) ${option.cssSuffix}");
  }
}
