import 'package:flutter/material.dart';

import 'image_url.dart';
import 'leftbar_route.dart';
import 'topbar_route.dart';

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
  "/topbarcolour": (context) => const TopBarRoute(),
  "/leftbarcolour": (context) => const LeftBarRoute(),
  "/mainschoolboxicon": (context) => const MainSchoolBoxIconRoute(),
};
