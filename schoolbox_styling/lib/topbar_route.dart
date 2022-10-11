import 'package:flutter/material.dart';

import 'colour_picker.dart';
import 'constants.dart';
import 'drawer.dart';

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
