import 'package:flutter/material.dart';
import 'package:schoolbox_styling/routes/bodybackground_route.dart';
import 'package:schoolbox_styling/routes/periodheaders_route.dart';

import 'routes/image_url.dart';
import 'routes/leftbar_route.dart';
import 'routes/topbar_route.dart';


final Map<KnownKeys, Color> resetColours = {
  KnownKeys.topBarColour: const Color(0xFF82c3eb),
  KnownKeys.leftBarColour: const Color(0xFF193c64),
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
}

final Map<String, Widget Function(BuildContext)> routes = {
  // "/": (context) => const ColourGenericRoute(
  //       propertyKey: KnownKeys.leftBarColour,
  //     ),
  "/topbarcolour": (context) => const TopBarRoute(),
  "/leftbarcolour": (context) => const LeftBarRoute(),
  "/mainschoolboxicon": (context) => const MainSchoolBoxIconRoute(),

  "/bodybackgroundcolour": (context) => const BodyBackgroundRoute(),
  "/timetableperiodheaders": (context) => const PeriodHeadersRoute(),
};
