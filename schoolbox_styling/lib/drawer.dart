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
        knownKey: KnownKeys.topBarColour,
      ),
      DrawerOption(knownKey: KnownKeys.leftBarColour),
      DrawerOption(knownKey: KnownKeys.mainSchoolBoxIconURL),
      DrawerOption(knownKey: KnownKeys.bodyBackgroundColour),
      DrawerOption(knownKey: KnownKeys.timetablePeriodHeaders),
    ]));
  }
}

class DrawerOption extends StatelessWidget {
  const DrawerOption({super.key, required this.knownKey});

  final KnownKeys knownKey;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(routeNames[knownKey]!),
      onTap: () {
        Navigator.pushNamed(context, knownKey.route);
      },
    );
  }
}
