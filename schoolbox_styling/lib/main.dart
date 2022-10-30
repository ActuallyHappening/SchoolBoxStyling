// import 'package:cloud_firestore/cloud_firestore.dart';
// import 'package:firebase_core/firebase_core.dart';
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
