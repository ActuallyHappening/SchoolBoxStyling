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
  KnownKeys.timetablePeriodHeaders: const Color(0xFFFFFFFF),
  KnownKeys.topBarIconColour: const Color(0xFF193C64),
  KnownKeys.topBarIconTextColour: const Color(0xFF193C64),
};

final Map<KnownKeys, String> routeNames = {
  KnownKeys.topBarColour: "Top Bar",
  KnownKeys.leftBarColour: "Left Bar",
  KnownKeys.mainSchoolBoxIconURL: "Main School Box Icon",
  KnownKeys.bodyBackgroundColour: "Background",
  KnownKeys.timetablePeriodHeaders: "Period Headers",
};

enum KnownKeys {
  topBarColour,
  leftBarColour,
  mainSchoolBoxIconURL,

  bodyBackgroundColour,
  timetablePeriodHeaders,

  topBarIconColour,
  topBarIconTextColour,
}

extension KnownKeysExt on KnownKeys {
  String get key => toString().split('.').last;

  String get route => "/$key";
}

final Map<String, Widget Function(BuildContext)> routes = {
  KnownKeys.topBarColour.route: (context) => const TopBarRoute(),
  KnownKeys.leftBarColour.route: (context) => const LeftBarRoute(),
  KnownKeys.mainSchoolBoxIconURL.route: (context) =>
      const MainSchoolBoxIconRoute(),

  KnownKeys.bodyBackgroundColour.route: (context) =>
      const BodyBackgroundRoute(),
  KnownKeys.timetablePeriodHeaders.route: (context) =>
      const PeriodHeadersRoute(),
};
