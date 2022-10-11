import 'package:flutter/material.dart';

class MyAppDrawer extends StatelessWidget {
  const MyAppDrawer({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Drawer(
        child: ListView(
      children: [
        // const DrawerHeader(child: Text("Extra Options ...")),
        ListTile(
          title: const Text("Top bar colour"),
          onTap: () {
            Navigator.pushNamed(context, "/topbarcolour");
          },
        ),
        ListTile(
          title: const Text("Left bar colour ✨Beta!✨"),
          onTap: () {
            Navigator.pushNamed(context, "/leftbarcolour");
          },
        ),
        ListTile(
          title: const Text("Main school box icon ✨Beta!✨"),
          onTap: () {
            Navigator.pushNamed(context, "/mainschoolboxicon");
          },
        )
      ],
    ));
  }
}
