import 'package:flutter/material.dart';
import 'package:schoolbox_styling/routes/colourbar_route.dart';

import '../constants.dart';

class LeftBarRoute extends StatelessWidget {
  const LeftBarRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const ColourGenericRoute(propertyKey: KnownKey.leftBarColour);
  }
}
