import 'package:flutter/material.dart';

import '../colour_picker.dart';
import '../constants.dart';
import '../drawer.dart';

class ColourGenericRoute extends StatelessWidget {
  const ColourGenericRoute({
    super.key,
    required this.propertyKey,
  });

  final KnownKey propertyKey;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      // length: 3,
      length: 2,
      child: Scaffold(
          body: TabBarView(children: [
            CustomColourPicker(
              propertyKey: propertyKey,
              colourPickerType: ColourTypes.materialButtons,
            ),
            // CustomColourPicker(
            //   propertyKey: propertyKey,
            //   colourPickerType: ColourTypes.pallet,
            // ),
            CustomColourPicker(
              propertyKey: propertyKey,
              colourPickerType: ColourTypes.sliders,
            )
          ]),
          appBar: AppBar(
              title: Text(propertyKey.routeName),
              bottom: TabBar(
                tabs: [
                  Tab(
                    child: Text(ColourTypes.materialButtons.name),
                  ),
                  // Tab(
                  //   child: Text(ColourTypes.pallet.name),
                  // ),
                  Tab(
                    child: Text(ColourTypes.sliders.name),
                  ),
                ],
              )),
          drawer: const MyAppDrawer()),
    );
  }
}
