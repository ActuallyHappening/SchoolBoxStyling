import 'dart:js' as js;
import 'dart:ui';

import 'constants.dart';

void sendNewValue(KnownKey key, String value) {
  print("Sending new value for $key: $value");
  js.context.callMethod("sendNewValue", [key.key, value]);
}

String toCSSColour(Color colour) {
  return "rgba(${colour.red}, ${colour.green}, ${colour.blue}, ${colour.alpha})";
}
