import 'package:flutter/material.dart';
import 'package:schoolbox_styling/value_choosers/value_choosers.dart';

import 'about.dart';

enum KnownKey {
  topBar,
  leftBar,

  timetableHeaders,
  background,
  iconNotifications,

  allBackgrounds,
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
        KnownKey.iconNotifications: "Notifications",
        KnownKey.allBackgrounds: "All Backgrounds",
      }[this]!;

  /// Put in the appBar title
  String get routeTitle => {
        KnownKey.topBar: "Style Top Bar",
        KnownKey.leftBar: "Style Left Bar",
        KnownKey.background: "Style Background",
        KnownKey.timetableHeaders: "Style Timetable Headers",
        KnownKey.iconNotifications: "Style Notifications Bar",
        KnownKey.allBackgrounds: "Style All Backgrounds",
      }[this]!;
}
final Map<String, Widget Function(BuildContext)> routes = (() {
  Map<String, Widget Function(BuildContext)> routes = {};
  for (var key in KnownKey.values) {
    // Every key has a routeName -> ValueChoosersRoute mapping
    routes[key.route] = (context) => AllValueChoosersRoute(
          propertyKey: key,
        );
  }
  routes["/about"] = (context) => const AboutRoute();
  return routes;
})();

