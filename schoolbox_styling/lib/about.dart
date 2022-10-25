import 'package:flutter/material.dart';
import 'package:schoolbox_styling/drawer.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutRoute extends StatelessWidget {
  const AboutRoute({super.key});

  static const discordInviteURL = "https://discord.gg/8PZpmndNbr";
  @override
  Widget build(BuildContext context) {
    return Scaffold(
        appBar: AppBar(
          title: const Text('About'),
          // leading: Builder(
          //   builder: (BuildContext context) {
          //     return IconButton(
          //       icon: const Icon(Icons.menu),
          //       onPressed: () {
          //         Scaffold.of(context).openDrawer();
          //       },
          //       tooltip: MaterialLocalizations.of(context).openAppDrawerTooltip,
          //     );
          //   },
          // ),
        ),
        drawer: const MyAppDrawer(),
        body: Padding(
          padding: const EdgeInsets.all(8.0),
          child: ListView(padding: const EdgeInsets.all(8), children: [
            const Text(
                "This extension is made by an Emmanuel Student, for the purpose of spicing up the schoolbox UI. It is not affiliated with Emmanuel College in any way."),
            const Text(
                "Use this as your own risk, if you get into trouble its your fault! If you have any issues, please contact me on Discord: Actually Happening#4909"),
            const Divider(),
            ElevatedButton(
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  if (!await launchUrl(Uri.parse(discordInviteURL))) {
                    // ignore: avoid_print
                    print("Failed to open URL!");
                    messenger.showSnackBar(const SnackBar(
                        content: Text(
                            "Failed to open Discord. Please contact Actually Happening#4909")));
                  }
                },
                child: const Text("Join the discord server!")),
            const Divider(),
            TextButton(
                onPressed: () {
                  showAboutDialog(context: context);
                },
                child: const Text(
                    "More Info, & Terms and Conditions (Legal stuff I don't care about :)"))
          ]),
        ));
  }
}
