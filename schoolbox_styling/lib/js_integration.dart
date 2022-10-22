// ignore: avoid_web_libraries_in_flutter
import 'dart:js' as js;
import 'dart:ui';

import 'constants.dart';

enum PossibleActions {
  reset,

  /// Assign a new value to a known key.
  newAssignedValue,
}

void sendNewValue(KnownKey key, PossibleActions action, String? value) {
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

extension KeySendValue on KnownKey {
  void send(String value) {
    sendNewValue(this, PossibleActions.newAssignedValue, value);
  }
}
