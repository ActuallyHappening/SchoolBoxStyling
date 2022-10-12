import 'package:flutter/material.dart';

import '../constants.dart';
import '../drawer.dart';
import '../js_integration.dart';

List<String> urls {
  "https://media.tenor.com/a6YLqoCk4cQAAAAM/kanye-west-king.gif",
  "https://media1.giphy.com/media/g7GKcSzwQfugw/giphy.gif?cid=790b7611fe5cbbfe2351ac8a4fb422325c00e2650709b600&rid=giphy.gif&ct=g",
}

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
          ListTile(
            // leading: const Icon(Icons.bento_rounded),
            title: const Text("New Icon"),
            onTap: () {
              // print("$propertyKey reset");
              sendNewValue(KnownKeys.mainSchoolBoxIconURL,
                  "https://media1.giphy.com/media/g7GKcSzwQfugw/giphy.gif?cid=790b7611fe5cbbfe2351ac8a4fb422325c00e2650709b600&rid=giphy.gif&ct=g");
            },
          ),
          const Text(
              "This feature allows you to set any picture as schoolbox's logo. As this can be abused, a password is required to unlock this feature. I am not responsible for you if you get in trouble for using this feature."),
          const Text("Hint: My OneNote"),
          const Center(child: URLInputFieldWithPassword()),
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
            hintText:
                isLocked
                ? 'Great power comes with great responsibility'
                : "Copy and paste url here, e.g. picsum.photos/300/300",
          ),
        )
      ],
    );
  }
}
