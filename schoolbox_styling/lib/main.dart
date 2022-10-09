import 'dart:js' as js;

import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

void changeColourTo(Color colour, String whichBar) {
  String cssColour =
      "rgba(${colour.red}, ${colour.green}, ${colour.blue}, ${colour.alpha})";
  print("Colour changed to: $cssColour, whichBar: $whichBar");

  if (whichBar == "topbarcolour") {
    js.context.callMethod("changeTopBarColour", [cssColour]);
  } else if (whichBar == "leftbarcolour") {
    js.context.callMethod("changeLeftBarColour", [cssColour]);
  } else {
    print("Error: whichBar is not set correctly, $whichBar");
  }
}

void main() {
  runApp(const MyApp());
}

final Map<String, Color> knownColours = {
  "Set top bar to newer colour": const Color(0xFF82c3eb),
  "Set top bar to older colour": const Color(0xFF193c64),
};

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'School Box Styling v1.1',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      routes: {
        "/topbarcolour": (context) => const TopBarRoute(),
        "/leftbarcolour": (context) => const LeftBarRoute()
      },
      initialRoute: "/topbarcolour",
    );
  }
}

List<Widget> genChildren(Map<String, Color> beginColours, String whichBar) {
  List<Widget> children = [];
  for (String name in beginColours.keys) {
    final Color colour = beginColours[name]!;
    children.add(ActionChip(
        label: Text(
          name,
        ),
        // backgroundColor: Color(colour.value).withAlpha(10),
        onPressed: () {
          print("preset colour callback");
          changeColourTo(colour, whichBar);
        }));
  }
  return children;
}

class TopBarRoute extends StatelessWidget {
  const TopBarRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: const ColourPicker("topbarcolour"),
        appBar: AppBar(title: const Text("Change Top Bar Colour")),
        drawer: Drawer(
            child: ListTile(
          title: const Text("Left bar colour"),
          onTap: () {
            Navigator.pushNamed(context, "/leftbarcolour");
          },
        )));
  }
}

class LeftBarRoute extends StatelessWidget {
  const LeftBarRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
        body: const ColourPicker("leftbarcolour"),
        appBar: AppBar(title: const Text("Change Left Bar Colour")),
        drawer: Drawer(
            child: ListTile(
          title: const Text("Top bar colour"),
          onTap: () {
            Navigator.pushNamed(context, "/topbarcolour");
          },
        )));
  }
}

class ColourPicker extends StatefulWidget {
  const ColourPicker(this.whichBar, {super.key});
  final String whichBar;

  @override
  State<ColourPicker> createState() => _ColourPickerState(whichBar);
}

class _ColourPickerState extends State<ColourPicker> {
  _ColourPickerState(this.whichBar) {
    knownChips = genChildren(knownColours, whichBar);
  }

  late List<Widget> knownChips;
  late String whichBar;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ...knownChips,
        MaterialPicker(
            pickerColor: Colors.blue,
            onColorChanged: (colour) {
              print("Colour changed callback");
              changeColourTo(colour, whichBar);
            })
      ],
    );
  }
}
