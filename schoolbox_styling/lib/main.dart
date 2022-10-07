import 'dart:js' as js;

import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

void changeColourTo(Color colour) {
  String cssColour =
      "rgba(${colour.red}, ${colour.green}, ${colour.blue}, ${colour.alpha})";
  print("Colour changed to: $cssColour");

  js.context.callMethod('changeColour', [cssColour]);
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
      home: Scaffold(
        body: const ColourPicker(),
        appBar: AppBar(title: const Text("Change Top Bar Colour")),
      ),
    );
  }
}

List<Widget> genChildren(Map<String, Color> beginColours) {
  List<Widget> children = [];
  for (String name in beginColours.keys) {
    final Color colour = beginColours[name]!;
    children.add(ActionChip(
        label: Text(
          name,
        ),
        // backgroundColor: Color(colour.value).withAlpha(10),
        onPressed: () {
          changeColourTo(colour);
        }));
  }
  return children;
}

class ColourPicker extends StatefulWidget {
  const ColourPicker({super.key});

  @override
  State<ColourPicker> createState() => _ColourPickerState();
}

class _ColourPickerState extends State<ColourPicker> {

  final knownChips = genChildren(knownColours);
  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ...knownChips,
        const MaterialPicker(
            pickerColor: Colors.blue, onColorChanged: changeColourTo)
      ],
    );
  }
}
