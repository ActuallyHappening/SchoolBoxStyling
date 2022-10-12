import 'package:flutter/material.dart';

import '../constants.dart';
import '../drawer.dart';
import '../js_integration.dart';

class MainSchoolBoxIconRoute extends StatelessWidget {
  const MainSchoolBoxIconRoute({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Picture URL Chooser"),
      ),
      drawer: const MyAppDrawer(),
      body: ListView(
        children: [
          ListTile(
            leading: const Icon(Icons.restart_alt_rounded),
            title: const Text("Reset"),
            onTap: () {
              // print("$propertyKey reset");
              sendNewValue(KnownKeys.mainSchoolBoxIconURL,
                  "/images/logo.php?logo=skin_logo_large&size=hidpi");
            },
          ),
          ListTile(
            // leading: const Icon(Icons.bento_rounded),
            title: const Text("Old Icon"),
            onTap: () {
              // print("$propertyKey reset");
              sendNewValue(KnownKeys.mainSchoolBoxIconURL,
                  "https://raw.githubusercontent.com/ActuallyHappening/SchoolBoxStyling/master/styling/Old%20Icon.png");
            },
          ),
          const Center(child: URLInputFieldWithPassword()),
          ListTile(
            // leading: const Icon(Icons.bento_rounded),
            title: const Text("New Icon"),
            onTap: () {
              // print("$propertyKey reset");
              sendNewValue(KnownKeys.mainSchoolBoxIconURL,
                  "https://variety.com/wp-content/uploads/2021/07/Rick-Astley-Never-Gonna-Give-You-Up.png?w=681&h=383&crop=1");
            },
          ),
        ],
      ),
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
                  hintText: "Enter password to be able to set schoolbox icon to ANY url",
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
            border: OutlineInputBorder(),
            hintText:
                isLocked ? 'Great power comes with great responsibility. Unlock to use' : "Copy and paste url here, e.g. picsum.photos/300/300",
          ),
        )
      ],
    );
  }
}
