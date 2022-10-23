import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

import './value_choosers.dart';
import '../constants.dart';
import '../js_integration.dart';

enum ColourTypes {
  material,
  buttons,
  sliders,
}

extension ColourTypesExt on ColourTypes {
  String get name => {
        ColourTypes.material: "Colour",
        ColourTypes.buttons: "Colour by buttons",
        ColourTypes.sliders: "Colour by ✨ sliders ✨",
      }[this]!;
}

List<ValueChooser> colourValueChoosers = [
  ...ColourTypes.values
      .map((type) => ValueChooser(
          name: type.name,
          body: (key) => (context) => CustomColourPicker(
                colourPickerType: type,
                propertyKey: key,
              )))
      .toList(),
];

class CustomColourPicker extends StatelessWidget {
  const CustomColourPicker({
    super.key,
    required this.propertyKey,
    required this.colourPickerType,
  });

  final KnownKey propertyKey;
  final ColourTypes colourPickerType;

  @override
  Widget build(BuildContext context) {
    final chips = [
      // ListTile(
      //     title: Text(
      //         "This colourPIckerTYpes name: ${colourPickerType.name} $colourPickerType")),
      ListTile(
        leading: const Icon(Icons.restart_alt_rounded),
        title: const Text("Reset"),
        onTap: propertyKey.reset,
      )
    ];
    return Column(
      children: [
        ...chips,
        _CustomColourPicker(
            colourPickerType: colourPickerType,
            defaultColour: Colors.blue,
            onColourChanged: (colour) {
              propertyKey.sendColour(colour);
            }),
      ],
    );
  }
}

class _CustomColourPicker extends StatelessWidget {
  const _CustomColourPicker({
    required this.colourPickerType,
    required this.defaultColour,
    required this.onColourChanged,
  });

  final ColourTypes colourPickerType;
  final Color defaultColour;
  final Function(Color) onColourChanged;

  @override
  Widget build(BuildContext context) {
    switch (colourPickerType) {
      case ColourTypes.material:
        return MaterialPicker(
          pickerColor: defaultColour,
          onColorChanged: onColourChanged,
          // enableLabel: true,
        );
      case ColourTypes.sliders:
        return ColorPicker(
          pickerColor: defaultColour,
          onColorChanged: onColourChanged,
        );
      case ColourTypes.buttons:
        return BlockPicker(
          pickerColor: defaultColour,
          onColorChanged: onColourChanged,
        );
      // default:
      //   return MaterialPicker(
      //     pickerColor: defaultColour,
      //     onColorChanged: onColourChanged,
      //     // enableLabel: true,
      //   );
    }
  }
}
