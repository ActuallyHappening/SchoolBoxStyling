import 'package:flutter/material.dart';
import 'package:schoolbox_styling/colour_picker.dart';
import 'package:schoolbox_styling/routes/colourbar_route.dart';


final Map<KnownKeys, Color> resetColours = {
  KnownKeys.topBarColour: const Color(0xFF82c3eb),
  KnownKeys.leftBarColour: const Color(0xFF193c64),
};

enum KnownKeys {
  topBarColour,
  leftBarColour,
  mainSchoolBoxIconURL,
}

extension KnownKeysExt on KnownKeys {
  String get key => toString().split('.').last;
}

final Map<String, Widget Function(BuildContext)> routes = {
  "/": (context) => const ColourGenericRoute(
        propertyKey: KnownKeys.leftBarColour,
        colourType: ColourTypes.pallet,
      ),
  // "/topbarcolour": (context) => const TopBarRoute(),
  // "/leftbarcolour": (context) => const LeftBarRoute(),
  // "/mainschoolboxicon": (context) => const MainSchoolBoxIconRoute(),
};
