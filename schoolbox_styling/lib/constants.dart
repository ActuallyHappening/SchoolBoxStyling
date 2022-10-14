import 'package:flutter/material.dart';
import 'package:schoolbox_styling/routes/bodybackground_route.dart';
import 'package:schoolbox_styling/routes/periodheaders_route.dart';

import 'routes/leftbar_route.dart';
import 'routes/topbar_route.dart';
import 'routes/urlchooser_route.dart';

extension ConstantsKeysExt on KnownKey {
  Color get resetColour => {
        KnownKey.topBarColour: const Color(0xFF82c3eb),
        KnownKey.leftBarColour: const Color(0xFF193c64),
        KnownKey.bodyBackgroundColour: const Color(0xFFdddddd),
        KnownKey.timetablePeriodHeaders: const Color(0xFFFFFFFF),
        KnownKey.topBarIconColour: const Color(0xFF193C64),
        KnownKey.topBarIconTextColour: const Color(0xFF193C64),
      }[this]!;
}

enum KnownKey {
  topBarColour,
  leftBarColour,

  mainSchoolBoxIconURL,
  secondarySchoolBoxIconURL,

  bodyBackgroundColour,
  timetablePeriodHeaders,

  topBarIconColour,
  topBarIconTextColour,
}

extension RoutingKeysExt on KnownKey {
  String get key => toString().split('.').last;

  String get route => "/$key";

  String get routeName => {
        KnownKey.topBarColour: "Top Bar",
        KnownKey.leftBarColour: "Left Bar",
        KnownKey.mainSchoolBoxIconURL: "Main School Box Icon",
        KnownKey.bodyBackgroundColour: "Background",
        KnownKey.timetablePeriodHeaders: "Period Headers",
      }[this]!;

  String get routeTitle => {
        KnownKey.topBarColour: "Change Top Bar Colour",
        KnownKey.leftBarColour: "Change Left Bar Colour",
        KnownKey.mainSchoolBoxIconURL: "Set Schoolbox Icon",
        KnownKey.bodyBackgroundColour: "Change Background Colour",
        KnownKey.timetablePeriodHeaders: "Change Period Colours",
      }[this]!;
}

final Map<String, Widget Function(BuildContext)> routes = {
  KnownKey.topBarColour.route: (context) => const TopBarRoute(),
  KnownKey.leftBarColour.route: (context) => const LeftBarRoute(),
  KnownKey.mainSchoolBoxIconURL.route: (context) =>
      const MainSchoolBoxIconRoute(),
  KnownKey.bodyBackgroundColour.route: (context) =>
      const BodyBackgroundRoute(),
  KnownKey.timetablePeriodHeaders.route: (context) =>
      const PeriodHeadersRoute(),
};
