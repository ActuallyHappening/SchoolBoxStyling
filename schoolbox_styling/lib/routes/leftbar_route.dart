import 'package:flutter/material.dart';

import '../colour_picker.dart';
import '../constants.dart';
import '../drawer.dart';

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
