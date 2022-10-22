import 'package:flutter/material.dart';

import 'routes/leftbar_route.dart';
import 'routes/topbar_route.dart';


enum KnownKey {
  topBar,
  leftBar,

  timetableHeaders,
  background,
}

extension RoutingKeysExt on KnownKey {
  /// Returns the raw key, which interfaces with popup.ts
  String get key => toString().split('.').last;

  /// Returns the route name
  String get route => "/$key";

  /// Put in the drawer
  String get routeName => {
        KnownKey.topBar: "Top Bar",
        KnownKey.leftBar: "Left Bar",
        KnownKey.background: "Background",
        KnownKey.timetableHeaders: "Period Headers",
      }[this]!;

  /// Put in the appBar title
  String get routeTitle => {
        KnownKey.topBar: "Change Top Bar Colour",
        KnownKey.leftBar: "Change Left Bar Colour",
        KnownKey.background: "Change Background Colour",
        KnownKey.timetableHeaders: "Change Period Colours",
      }[this]!;
}

final Map<String, Widget Function(BuildContext)> routes = {
  KnownKey.topBar.route: (context) => const TopBarRoute(),
  KnownKey.leftBar.route: (context) => const LeftBarRoute(),

};
