import 'package:flutter/material.dart';

import 'constants.dart';

void main() {
  debugPrint("Route names are: ${routes.keys}");
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'School Box Styling v1.6',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      routes: routes,
      initialRoute: "/${KnownKey.topBar.key}",
    );
  }
}
