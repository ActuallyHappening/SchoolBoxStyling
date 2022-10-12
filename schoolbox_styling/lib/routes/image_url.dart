import 'package:flutter/material.dart';

import '../constants.dart';
import '../drawer.dart';
import '../js_integration.dart';

List<String> urls = [
  "https://media.tenor.com/a6YLqoCk4cQAAAAM/kanye-west-king.gif",
  "https://media1.giphy.com/media/g7GKcSzwQfugw/giphy.gif?cid=790b7611fe5cbbfe2351ac8a4fb422325c00e2650709b600&rid=giphy.gif&ct=g",
];

class MainSchoolBoxIconRoute extends StatelessWidget {
  const MainSchoolBoxIconRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(KnownKeys.mainSchoolBoxIconURL.routeTitle),
      ),
      drawer: const MyAppDrawer(),
      body: ListView(
        children: const [
          _DefaultURLOption(
              url: mainSchoolBoxIconURLDefault,
              name: "Reset",
              icon: _DefaultURLOption.resetIcon),
          _DefaultURLOption(
              url:
                  "https://raw.githubusercontent.com/ActuallyHappening/SchoolBoxStyling/master/styling/Old%20Icon.png",
              name: "Old Icon"),
          _DefaultURLOption(
              url:
                  "https://media1.giphy.com/media/g7GKcSzwQfugw/giphy.gif?cid=790b7611fe5cbbfe2351ac8a4fb422325c00e2650709b600&rid=giphy.gif&ct=g",
              name: "New Icon"),
          Text(
              "This feature allows you to set any picture as schoolbox's logo. As this can be abused, a password is required to unlock this feature. I am not responsible for you if you get in trouble for using this feature."),
          Text("Hint: My OneNote"),
          Center(child: URLInputFieldWithPassword()),
        ],
      ),
    );
  }
}

class _DefaultURLOption extends StatelessWidget {
  const _DefaultURLOption({required this.url, required this.name, this.icon});

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
        sendNewValue(KnownKeys.mainSchoolBoxIconURL, url);
      },
    );
  }
}

class URLInputFieldWithPassword extends StatefulWidget {
  const URLInputFieldWithPassword({super.key});

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
                },
                decoration: const InputDecoration(
                  hintText: "Enter password to unlock",
                ),
              )
            : const Card(child: Text("Unlocked!")),
        TextField(
          readOnly: isLocked,
          onChanged: (String text) {
            if (isLocked) {
              print("LOCKED new text: $text");
            } else {
              print("New URL text: $text");
              sendNewValue(KnownKeys.mainSchoolBoxIconURL, text);
            }
          },
          decoration: InputDecoration(
            border: const OutlineInputBorder(),
            hintText: isLocked
                ? 'Great power comes with great responsibility'
                : "Copy and paste url here, e.g. picsum.photos/300/300",
          ),
        )
      ],
    );
  }
}
