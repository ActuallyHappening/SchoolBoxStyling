import 'package:flutter/material.dart';
import 'package:schoolbox_styling/value_choosers/value_choosers.dart';

import '../constants.dart';

final textValueChoosers = <ValueChooser>[
  ValueChooser(
    name: "Text",
    body: (key) => (context) => TextValueChooser(
          propertyKey: key,
        ),
  ),
];

class TextValueChooser extends StatefulWidget {
  const TextValueChooser({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  State<TextValueChooser> createState() => _TextValueChooserState();
}

class _TextValueChooserState extends State<TextValueChooser> {
  @override
  Widget build(BuildContext context) {
    return Container();
  }
}
