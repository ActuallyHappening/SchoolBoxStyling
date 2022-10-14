import 'package:flutter/material.dart';

import '../constants.dart';
import '../drawer.dart';
import '../js_integration.dart';

const mainSchoolBoxIconURLDefault =
    "/images/logo.php?logo=skin_logo_large&size=hidpi";

const List<URLPresetOption> mainSchoolBoxPresets = [
  URLPresetOption(
      url: mainSchoolBoxIconURLDefault,
      name: "Reset",
      icon: URLPresetOption.resetIcon),
  URLPresetOption(
      url:
          "https://raw.githubusercontent.com/ActuallyHappening/SchoolBoxStyling/master/styling/Old%20Icon.png",
      name: "Old Icon"),
  URLPresetOption(
      url: "https://media.tenor.com/x8v1oNUOmg4AAAAd/rickroll-roll.gif",
      name: "Rick Roll"),
  URLPresetOption(
      url: "https://media.tenor.com/a6YLqoCk4cQAAAAM/kanye-west-king.gif",
      name: "Kanye"),
];

class SecondarySchoolBoxIconRoute extends StatelessWidget {
  const SecondarySchoolBoxIconRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return const GenericURLChooserRoute(
      presets: mainSchoolBoxPresets,
      propertyKey: KnownKey.secondarySchoolBoxIconURL,
    );
  }
}

class MainSchoolBoxIconRoute extends StatelessWidget {
  const MainSchoolBoxIconRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return const GenericURLChooserRoute(
      presets: mainSchoolBoxPresets,
      propertyKey: KnownKey.mainSchoolBoxIconURL,
    );
  }
}

class GenericURLChooserRoute extends StatelessWidget {
  const GenericURLChooserRoute(
      {super.key,
      required this.presets,
      this.extras,
      required this.propertyKey});

  final KnownKey propertyKey;

  final List<URLPresetOption> presets;
  final List<Widget>? extras;

  final List<Widget> others = const [
    Text(
        "This feature allows you to set any picture as schoolbox's logo. As this can be abused, a password is required to unlock this feature. I am not responsible for you if you get in trouble for using this feature."),
    Text("Hint: My OneNote"),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(KnownKey.mainSchoolBoxIconURL.routeTitle),
      ),
      drawer: const MyAppDrawer(),
      body: ListView(
        children: [
          ...presets,
          ...?extras,
          Center(
              child: URLInputFieldWithPassword(
            propertyKey: propertyKey,
          )),
        ],
      ),
    );
  }
}

class URLPresetOption extends StatelessWidget {
  const URLPresetOption(
      {super.key, required this.url, required this.name, this.icon});

  final String url;
  final String name;
  final Icon? icon;

  static const resetIcon = Icon(Icons.restart_alt_rounded);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: icon,
      title: Text(name),
      onTap: () {
        sendNewValue(KnownKey.mainSchoolBoxIconURL, url);
      },
    );
  }
}

class URLInputFieldWithPassword extends StatefulWidget {
  const URLInputFieldWithPassword({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  State<URLInputFieldWithPassword> createState() =>
      _URLInputFieldWithPasswordState();
}

class _URLInputFieldWithPasswordState extends State<URLInputFieldWithPassword> {
  bool isLocked = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        isLocked
            ? TextField(
                onChanged: (text) {
                  if (text == "cheat") {
                    print("Unlocked field!");
                    setState(() {
                      isLocked = false;
                    });
                  }
                  if (isLocked) {
                    print("LOCKED new text: $text");
                  } else {
                    print("New URL text: $text");
                    sendNewValue(widget.propertyKey, text);
                  }
                },
                decoration: const InputDecoration(
                  hintText: "Enter password to unlock",
                ),
              )
            : const Card(child: Text("Unlocked!")),
      ],
    );
  }
}
