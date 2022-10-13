import 'package:flutter/material.dart';
import 'package:schoolbox_styling/constants.dart';

class MyAppDrawer extends StatelessWidget {
  const MyAppDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
        child: ListView(
      children: const [
      DrawerOption(
        knownKey: KnownKey.topBarColour,
      ),
      DrawerOption(knownKey: KnownKey.leftBarColour),
      DrawerOption(knownKey: KnownKey.mainSchoolBoxIconURL),
      DrawerOption(knownKey: KnownKey.bodyBackgroundColour),
      DrawerOption(knownKey: KnownKey.timetablePeriodHeaders),
    ]));
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
        print(
            "Changing screen to ${knownKey.route} for key $knownKey, name ${knownKey.routeName}.");
        Navigator.pushNamed(context, knownKey.route);
      },
    );
  }
}
