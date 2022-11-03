import 'package:flutter/material.dart';

import '../constants.dart';
import '../js_integration.dart';
import 'value_choosers.dart';

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
    return Column(children: [
      const Text("Choose your own name!"),
      Padding(
        padding: const EdgeInsets.all(8),
        child: TextField(
          onChanged: (text) => widget.propertyKey.send(value: text),
          decoration:
              const InputDecoration(hintText: "Type to change your name!"),
        ),
      ),
    ]);
  }
}
