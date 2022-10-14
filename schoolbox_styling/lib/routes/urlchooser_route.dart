import 'package:flutter/material.dart';
import 'package:schoolbox_styling/drawer.dart';

import '../constants.dart';
import '../js_integration.dart';

const mainSchoolBoxIconURLDefault =
    "/images/logo.php?logo=skin_logo_large&size=hidpi";

const secondarySchoolBoxIconURLDefault =
    "/images/logo.php?logo=skin_logo_square&size=normal"; // FIXME

const List<URLPresetOption> _bothSchoolBoxIconPresets = [
  URLPresetOption(
      url:
          "https://raw.githubusercontent.com/ActuallyHappening/SchoolBoxStyling/master/styling/Old%20Icon.png",
      name: "Old Icon"),
  URLPresetOption(
      url: "https://media.tenor.com/x8v1oNUOmg4AAAAd/rickroll-roll.gif",
      name: "New Icon"),
  URLPresetOption(
      url: "https://media.tenor.com/a6YLqoCk4cQAAAAM/kanye-west-king.gif",
      name: "Kanye"),
];

const List<URLPresetOption> bothSchoolBoxIconPresets = [
  URLPresetOption(
    url: "ERROR: Both Reset Logic is broken (you should never see this)",
    name: "Reset (both)",
    isBothResetButton: true,
  )
];

const List<URLPresetOption> mainSchoolBoxPresets = [
  URLPresetOption(
      url: mainSchoolBoxIconURLDefault,
      name: "Reset",
      icon: URLPresetOption.resetIcon),
  ..._bothSchoolBoxIconPresets,
];

const List<URLPresetOption> secondarySchoolBoxPresets = [
  URLPresetOption(
      url: mainSchoolBoxIconURLDefault,
      name: "Reset",
      icon: URLPresetOption.resetIcon),
  ..._bothSchoolBoxIconPresets,
];

class SecondarySchoolBoxIconRoute extends StatelessWidget {
  const SecondarySchoolBoxIconRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return const GenericURLChooserBody(
      presets: mainSchoolBoxPresets,
      propertyKey: KnownKey.secondarySchoolBoxIconURL,
    );
  }
}

class MainSchoolBoxIconRoute extends StatelessWidget {
  const MainSchoolBoxIconRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return GenericURLChooserRoute(
      propertyKey: KnownKey.bothSchoolBoxIconURL,
      presets: bothSchoolBoxIconPresets,
    );
  }
}

class BothSchoolBoxIconRoute extends StatelessWidget {
  const BothSchoolBoxIconRoute({super.key});

  @override
  Widget build(BuildContext context) {
    return Container();
  }
}

class GenericURLChooserRoute extends StatelessWidget {
  const GenericURLChooserRoute(
      {super.key, List<URLPresetOption>? presets, required this.propertyKey})
      : isBoth = propertyKey == KnownKey.bodyBackgroundColour,
        presets = (propertyKey == KnownKey.mainSchoolBoxIconURL
            ? mainSchoolBoxPresets
            : propertyKey == KnownKey.secondarySchoolBoxIconURL
                ? secondarySchoolBoxPresets
                : bothSchoolBoxIconPresets);

  final KnownKey propertyKey;
  final bool isBoth;

  final List<URLPresetOption> presets;

  @override
  Widget build(BuildContext context) {
    if (!isBoth) {
      return Scaffold(
          drawer: const MyAppDrawer(),
          appBar: AppBar(
            title: Text(propertyKey.routeTitle),
          ),
          body: GenericURLChooserBody(
              presets: presets, propertyKey: propertyKey));
    }
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        drawer: const MyAppDrawer(),
        appBar: AppBar(
            title: Text(propertyKey.routeTitle),
            bottom: const TabBar(tabs: [
              Tab(
                child: Text("All Icons"),
              ),
              Tab(child: Text("Large Icon Only")),
              Tab(child: Text("Small Icon Only")),
            ])),
        body: TabBarView(children: [
          GenericURLChooserBody(presets: presets, propertyKey: propertyKey)
        ]),
      ),
    );
  }
}

class GenericURLChooserBody extends StatelessWidget {
  const GenericURLChooserBody(
      {super.key, required this.presets, required this.propertyKey});

  final KnownKey propertyKey;

  final List<URLPresetOption> presets;

  final List<Widget> others = const [
    Text(
        "This feature allows you to set any picture as schoolbox's logo. As this can be abused, a password is required to unlock this feature. I am not responsible for you if you get in trouble for using this feature."),
    Text("Hint: My OneNote"),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ...presets,
        Center(
            child: URLInputFieldWithPassword(
          propertyKey: propertyKey,
        )),
      ],
    );
  }
}

class URLPresetOption extends StatelessWidget {
  const URLPresetOption(
      {super.key,
      required this.url,
      required this.name,
      this.icon,
      isBothResetButton})
      : isBothResetButton = isBothResetButton ?? false;

  final String url;
  final String name;
  final Icon? icon;
  final bool isBothResetButton;

  static const resetIcon = Icon(Icons.restart_alt_rounded);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: icon,
      title: Text(name),
      onTap: () {
        if (isBothResetButton == true) {
          // Send both default values
          KnownKey.mainSchoolBoxIconURL.send(mainSchoolBoxIconURLDefault);
          KnownKey.secondarySchoolBoxIconURL
              .send(secondarySchoolBoxIconURLDefault);
          return;
        }
        KnownKey.mainSchoolBoxIconURL.send(url);
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
                    print("New URL: $text");
                    widget.propertyKey.send(text);
                  }
                },
                decoration: const InputDecoration(
                  hintText: "Enter password to unlock",
                ),
              )
            : const Padding(
                padding: EdgeInsets.all(5),
                child: Card(child: Text("Unlocked!"))),
      ],
    );
  }
}
