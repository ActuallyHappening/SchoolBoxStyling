import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

import 'constants.dart';
import 'js_integration.dart';

class ColourPicker extends StatelessWidget {
  ColourPicker({
    super.key,
    required this.propertyKey,
  }) {
    chips = [
      ListTile(
        leading: const Icon(Icons.restart_alt_rounded),
        iconColor: resetColours[propertyKey],
        title: const Text("Reset"),
        onTap: () {
          // print("$propertyKey reset");
          sendNewValue(propertyKey, toCSSColour(resetColours[propertyKey]!));
        },
      )
    ];
  }

  final KnownKeys propertyKey;
  late List<Widget> chips;

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
