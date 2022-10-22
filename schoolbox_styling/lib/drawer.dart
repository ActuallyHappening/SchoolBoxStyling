import 'package:flutter/material.dart';
import 'package:schoolbox_styling/constants.dart';

// TODO: Rename to `AllRouteNamesDrawer`
class MyAppDrawer extends StatelessWidget {
  const MyAppDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
        child: ListView(
            children: KnownKey.values.map((key) {
      return DrawerOption(knownKey: key);
    }).toList()));
  }
}


class DrawerOption extends StatelessWidget {
  const DrawerOption({super.key, required this.knownKey});

  final KnownKey knownKey;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(knownKey.routeName),
      onTap: () {
        // ignore: avoid_print
        print(
            "Changing screen to ${knownKey.route} for key $knownKey, name ${knownKey.routeName}.");
        Navigator.pushNamed(context, knownKey.route);
      },
    );
  }
}
