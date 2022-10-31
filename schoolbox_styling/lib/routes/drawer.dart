import 'package:flutter/material.dart';
import 'package:schoolbox_styling/constants.dart';
import 'package:schoolbox_styling/js_integration.dart';

// TODO: Rename to `AllRouteNamesDrawer`
class MyAppDrawer extends StatelessWidget {
  const MyAppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final List<Widget> drawerExpand = [];
    for (var key in KnownKey.values) {
      final isAllBackground = key == KnownKey.allBackgrounds;
      if (isAllBackground) {
        drawerExpand.add(const Divider());
      }
      drawerExpand.add(DrawerOption(
          knownKey: key,
          colour: isAllBackground ? Colors.green as Color : null));
    }
    return Drawer(
        child: ListView(children: [
      ...drawerExpand,
      const Divider(),
      ListTile(
          title: const Text("RESET ALL"),
          tileColor: Colors.yellow,
          onTap: () {
            KnownKey.allBackgrounds.reset();
          }),
      const Divider(),
      ListTile(
        title: const Text(
          "About",
          style: TextStyle(fontStyle: FontStyle.italic),
        ),
        onTap: () {
          Navigator.pushNamed(context, "/about");
        },
      )
    ]));
  }
}

class DrawerOption extends StatelessWidget {
  const DrawerOption(
      {super.key, required this.knownKey, this.colour = Colors.white});

  final KnownKey knownKey;
  final Color? colour;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(knownKey.routeName),
      tileColor: colour,
      onTap: () {
        // ignore: avoid_print
        print(
            "Changing screen to ${knownKey.route} for key $knownKey, name ${knownKey.routeName}.");
        Navigator.pushNamed(context, knownKey.route);
      },
    );
  }
}
