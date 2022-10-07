import 'dart:js' as js;

import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

void changeColourTo(String colour) {
  js.context.callMethod('changeColour', [colour]);
}

void main() {
  changeColourTo("green");
  runApp(const MyApp());
}

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
      home: const ColourPicker(),
    );
  }
}

extension HexColor on Color {
  /// Prefixes a hash sign if [leadingHashSign] is set to `true` (default is `true`).
  String toHex({bool leadingHashSign = true}) => '${leadingHashSign ? '#' : ''}'
      '${alpha.toRadixString(16).padLeft(2, '0')}'
      '${red.toRadixString(16).padLeft(2, '0')}'
      '${green.toRadixString(16).padLeft(2, '0')}'
      '${blue.toRadixString(16).padLeft(2, '0')}';
}

class ColourPicker extends StatefulWidget {
  const ColourPicker({super.key});

  @override
  State<ColourPicker> createState() => _ColourPickerState();
}

class _ColourPickerState extends State<ColourPicker> {
  Color chosenColour = Colors.blue;
  @override
  Widget build(BuildContext context) {
    return MaterialPicker(
        pickerColor: chosenColour,
        onColorChanged: (Color colour) {
          setState(() {
            chosenColour = colour;
          });
          print("Colour changed to: ${colour.toHex()}");
          changeColourTo(chosenColour.toHex());
        });
  }
}
