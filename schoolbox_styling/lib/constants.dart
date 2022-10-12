import 'package:flutter/material.dart';
import 'package:schoolbox_styling/routes/bodybackground_route.dart';
import 'package:schoolbox_styling/routes/periodheaders_route.dart';

import 'routes/image_url.dart';
import 'routes/leftbar_route.dart';
import 'routes/topbar_route.dart';

final Map<KnownKeys, Color> resetColours = {
  KnownKeys.topBarColour: const Color(0xFF82c3eb),
  KnownKeys.leftBarColour: const Color(0xFF193c64),
  KnownKeys.bodyBackgroundColour: const Color(0xFFdddddd),
  KnownKeys.timetablePeriodHeaders: const Color(0xFFFFFFFF)
};

enum KnownKeys {
  topBarColour,
  leftBarColour,
  mainSchoolBoxIconURL,

  bodyBackgroundColour,
  timetablePeriodHeaders,
}

extension KnownKeysExt on KnownKeys {
  String get key => toString().split('.').last;

  String get route => "/$key";
}

final Map<String, Widget Function(BuildContext)> routes = {
  "/${KnownKeys.topBarColour.key}": (context) => const TopBarRoute(),
  "/${KnownKeys.leftBarColour.key}": (context) => const LeftBarRoute(),
  "/${KnownKeys.mainSchoolBoxIconURL.key}": (context) =>
      const MainSchoolBoxIconRoute(),

  "/${KnownKeys.bodyBackgroundColour.key}": (context) =>
      const BodyBackgroundRoute(),
  "/${KnownKeys.timetablePeriodHeaders.key}": (context) =>
      const PeriodHeadersRoute(),
};
