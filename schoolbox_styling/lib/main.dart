// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:firebase_core/firebase_core.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:schoolbox_styling/easter_egg.dart';

import 'constants.dart';
// import 'firebase_options.dart';

void main() async {
  debugPrint("Route names are: ${routes.keys}");

  // WidgetsFlutterBinding.ensureInitialized();
  // await Firebase.initializeApp(
  //   options: DefaultFirebaseOptions.currentPlatform,
  // );
  // final db = FirebaseFirestore.instance;
  // final data = db.collection("preset-values");
  // // ignore: avoid_print
  // print(data);

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (context) => EasterEggState(),
      child: MaterialApp(
        title: 'School Box Styling',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        routes: routes,
        initialRoute: "/${KnownKey.allBackgrounds.key}",
      ),
    );
  }
}

/// Hints at status.
/// If you only care about url, url=true
/// If you only case about fatal, fatal=true
hintStatus(context, {bool? url, bool? fatal}) async {
  final messenger = ScaffoldMessenger.of(context);
  final resp0 = await Dio().get(
      "https://firestore.googleapis.com/v1/projects/better-schoolbox-1f647/databases/(default)/documents/default-config/global");

  // ignore: avoid_print
  print(resp0.data);

  final Map<String, dynamic> resp = resp0.data["fields"];
  final fully = resp["*"]!["stringValue"];
  final urlBackgrounds = resp["url-backgrounds"]!["stringValue"];

  SnackBar genSnackBar(String text) {
    return SnackBar(
      content: Text(text),
      behavior: SnackBarBehavior.fixed,
      duration: const Duration(minutes: 5),
    );
  }

  if (fully != "enabled") {
    // Fully disabled
    // if url=true, then don't care
    // && url != true
    messenger.showSnackBar(genSnackBar("Extension disabled warning: $fully"));
  } else if (urlBackgrounds != "enabled") {
    // Just urls disabled
    // if fatal, don't care
    //  && fatal != true
    messenger.showSnackBar(genSnackBar(
        "Extension disabled (from showing GIFs) warning: $urlBackgrounds"));
  }
}
