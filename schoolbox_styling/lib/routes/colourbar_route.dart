import 'package:flutter/material.dart';

import '../colour_picker.dart';
import '../constants.dart';
import '../drawer.dart';

const Map<KnownKeys, String> keysToNames = {
  KnownKeys.topBarColour: "ChangeTop Bar Colour",
  KnownKeys.leftBarColour: "Change Left Bar Colour",
};

class ColourGenericRoute extends StatelessWidget {
  const ColourGenericRoute({
    super.key,
    required this.propertyKey,
    required this.colourType,
  });

  final KnownKeys propertyKey;
  final ColourTypes colourType;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
          body: TabBarView(children: [
            CustomColourPicker(
              propertyKey: propertyKey,
              colourPickerType: ColourTypes.materialButtons,
            ),
            CustomColourPicker(
              propertyKey: propertyKey,
              colourPickerType: ColourTypes.pallet,
            ),
            CustomColourPicker(
              propertyKey: propertyKey,
              colourPickerType: ColourTypes.sliders,
            )
          ]),
          appBar: AppBar(
              title: Text(keysToNames[propertyKey]!),
              bottom: const TabBar(
                tabs: [
                  Tab(
                    child: Text("Buttons"),
                  ),
                  Tab(
                    child: Text("Pallet"),
                  ),
                  Tab(
                    child: Text("Sliders"),
                  ),
                ],
              )),
          drawer: const MyAppDrawer()),
    );
  }
}
