// ignore_for_file: public_member_api_docs, sort_constructors_first
import 'dart:js' as js;

import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

void main() {
  runApp(const MyApp());
}

enum KnownKeys {
  topBarColour,
  leftBarColour,
  mainSchoolBoxIconURL,
}

final Map<String, Widget Function(BuildContext)> routes = {
  "/topbarcolour": (context) => const TopBarRoute(),
  "/leftbarcolour": (context) => const LeftBarRoute(),
  "/mainschoolboxicon": (context) => const MainSchoolBoxIconRoute(),
};

void sendNewValue(KnownKeys key, String value) {
  js.context.callMethod("sendNewValue", [key.toString(), value]);
}

String toCSSColour(Color colour) {
  return "rgba(${colour.red}, ${colour.green}, ${colour.blue}, ${colour.alpha})";
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'School Box Styling v1.3',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      routes: routes,
      initialRoute: "/topbarcolour",
    );
  }
}

class MyAppDrawer extends StatelessWidget {
  const MyAppDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
        child: ListView(
      children: [
        // const DrawerHeader(child: Text("Extra Options ...")),
        ListTile(
          title: const Text("Top bar colour"),
          onTap: () {
            Navigator.pushNamed(context, "/topbarcolour");
          },
        ),
        ListTile(
          title: const Text("Left bar colour ✨Beta!✨"),
          onTap: () {
            Navigator.pushNamed(context, "/leftbarcolour");
          },
        ),
        ListTile(
          title: const Text("Main school box icon ✨Beta!✨"),
          onTap: () {
            Navigator.pushNamed(context, "/mainschoolboxicon");
          },
        )
      ],
    ));
  }
}

class MainSchoolBoxIconRoute extends StatelessWidget {
  const MainSchoolBoxIconRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Picture URL Choser"),
      ),
      drawer: const MyAppDrawer(),
      body: Center(
        child: TextField(
          onChanged: (String text) {
            print("New URL text: $text");
            sendNewValue(KnownKeys.mainSchoolBoxIconURL, text);
          },
          decoration: const InputDecoration(
            border: OutlineInputBorder(),
            hintText:
                'Copy Paste a picture url here, e.g. https://picsum.photos/300/300 ',
          ),
        ),
      ),
    );
  }
}

final Map<String, Color> knownColours = {
  "Reset": const Color(0xFF82c3eb),
  // "Set top bar to older colour": const Color(0xFF193c64),
};

class TopBarRoute extends StatelessWidget {
  const TopBarRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: ColourPicker(propertyKey: KnownKeys.topBarColour),
        appBar: AppBar(title: const Text("Change Top Bar Colour")),
        drawer: const MyAppDrawer());
  }
}

class LeftBarRoute extends StatelessWidget {
  const LeftBarRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: ColourPicker(propertyKey: KnownKeys.leftBarColour),
        appBar: AppBar(title: const Text("Change Left Bar Colour")),
        drawer: const MyAppDrawer());
  }
}

class ColourPicker extends StatelessWidget {
  ColourPicker({
    super.key,
    required this.propertyKey,
  });

  final KnownKeys propertyKey;
  final List<Widget> chips = [
    ListTile(
      iconColor: knownColours["Reset"],
      title: const Text("Reset"),
    )
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ...chips,
        MaterialPicker(
            pickerColor: Colors.blue,
            onColorChanged: (colour) {
              print("Colour changed callback");
              sendNewValue(propertyKey, toCSSColour(colour));
            })
      ],
    );
  }
}
