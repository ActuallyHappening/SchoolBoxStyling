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
  });

  final KnownKeys propertyKey;

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
              bottom: TabBar(
                tabs: [
                  Tab(
                    child: Text(ColourTypes.materialButtons.name),
                  ),
                  Tab(
                    child: Text(ColourTypes.pallet.name),
                  ),
                  Tab(
                    child: Text(ColourTypes.sliders.name),
                  ),
                ],
              )),
          drawer: const MyAppDrawer()),
    );
  }
}
