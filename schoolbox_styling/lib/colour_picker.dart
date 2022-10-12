import 'package:flutter/material.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

import 'constants.dart';
import 'js_integration.dart';

enum ColourTypes {
  materialButtons,
  pallet,
  sliders,
}

extension ColourTypesExt on ColourTypes {
  String get name => {
        ColourTypes.materialButtons: "Material",
        ColourTypes.pallet: "Pallet",
        ColourTypes.sliders: "Buttons",
      }[this]!;
}

class CustomColourPicker extends StatelessWidget {
  CustomColourPicker({
    super.key,
    required this.propertyKey,
    required this.colourPickerType,
  }) {
    chips = [
      ListTile(
        leading: const Icon(Icons.restart_alt_rounded),
        iconColor: resetColours[propertyKey],
        title: const Text("Reset"),
        onTap: () {
          sendNewValue(propertyKey, toCSSColour(resetColours[propertyKey]!));
        },
      )
    ];
  }

  final KnownKeys propertyKey;
  final ColourTypes colourPickerType;

  late List<Widget> chips;

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ...chips,
        _CustomColourPicker(
            colourPickerType: colourPickerType,
            defaultColour: Colors.blue,
            onColourChanged: (colour) {
              sendNewValue(propertyKey, toCSSColour(colour));
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
      case ColourTypes.materialButtons:
        return MaterialPicker(
          pickerColor: defaultColour,
          onColorChanged: onColourChanged,
          enableLabel: true,
        );
      // case ColourTypes.pallet:
      //   return ColorPicker(
      //     pickerColor: defaultColour,
      //     onColorChanged: onColourChanged,
      //   );
      case ColourTypes.sliders:
        return BlockPicker(
          pickerColor: defaultColour,
          onColorChanged: onColourChanged,
        );
      default:
        return MaterialPicker(
          pickerColor: defaultColour,
          onColorChanged: onColourChanged,
          enableLabel: true,
        );
    }
  }
}
