import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';

import '../constants.dart';
import '../js_integration.dart';

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
        Center(
            child: URLInputFieldWithPassword(
          propertyKey: propertyKey,
        )),
        StreamBuilder(
            stream: FirebaseFirestore.instance
                .collection('preset-urls')
                .snapshots(),
            builder: (context, snapshot) {
              if (snapshot.hasError) {
                return const Text(
                    'Something went wrong retrieving preset urls :(');
              }
              if (!snapshot.hasData) {
                return const Text("Loading preset urls ...");
              }
              return ListView.builder(
                itemCount: snapshot.data!.docs.length,
                itemBuilder: (context, index) {
                  final doc = snapshot.data!.docs[index];
                  assert(doc['name']);
                  assert(doc['url']);
                  return ListTile(
                    title: Text(doc['name']),
                    onTap: () {
                      propertyKey.send(value: doc['url']);
                    },
                  );
                },
              );
            })
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
      isBothResetButton});

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
