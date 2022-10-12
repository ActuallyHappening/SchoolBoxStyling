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
          Center(
            child: TextField(
              onChanged: (String text) {
                print("New URL text: $text");
                sendNewValue(KnownKeys.mainSchoolBoxIconURL, text);
              },
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText:
                    'Copy Paste a picture url here, e.g. https://picsum.photos/300/300 ',
              ),
            ),
          )
        ],
      ),
    );
  }
}
