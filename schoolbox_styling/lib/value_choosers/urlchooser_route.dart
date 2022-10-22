import 'package:dio/dio.dart';
import 'package:flutter/material.dart';

import './value_choosers.dart';
import '../constants.dart';
import '../js_integration.dart';

List<ValueChooser> urlValueChoosers = [
  ValueChooser(
      name: "Image (URL)",
      body: (key) => (context) => GenericURLChooserBody(
            propertyKey: key,
          )),
  ValueChooser(
      name: "Image (Presets)",
      body: (key) => (context) => GenericURLChooserBody(
            propertyKey: key,
            showPresets: true,
          )),
];

class GenericURLChooserBody extends StatelessWidget {
  const GenericURLChooserBody(
      {super.key, required this.propertyKey, this.showPresets = true});

  final KnownKey propertyKey;
  final bool showPresets;

  final List<Widget> others = const [
    Text(
        "This feature allows you to set any picture as schoolbox's logo. As this can be abused, a password is required to unlock this feature. I am not responsible for you if you get in trouble for using this feature."),
    Text("Hint: My OneNote"),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      children: [
        ...others,
        Center(
            child: URLInputFieldWithPassword(
          propertyKey: propertyKey,
        )),
        if (showPresets) FireStorePresetURLs(propertyKey: propertyKey),
      ],
    );
  }
}

class FireStorePresetURLs extends StatefulWidget {
  const FireStorePresetURLs({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  State<FireStorePresetURLs> createState() => _FireStorePresetURLsState();
}

class _FireStorePresetURLsState extends State<FireStorePresetURLs> {
  Map<String, String> loadedURLPresets = {"Loading ...": "Loading ..."};

  var dio = Dio();

  loadURLPresets() {
    getURLPresets().then((value) {
      setState(() {
        loadedURLPresets = value;
      });
    });
  }

  Future<Map<String, String>> getURLPresets() async {
    // Using dio
    // return Dio().get("https://schoolbox-website.web.app/presets.json").then((value) => value.data);
    const String projectID = "better-schoolbox-1f647";
    const String collectionID = "preset-urls";
    return await dio
        .get(
            "https://firestore.googleapis.com/v1/projects/$projectID/databases/(default)/documents/$collectionID")
        .then((value) => value.data)
        .then((value) => value["documents"])
        .then((value) => value.map((e) => MapEntry(
            e["fields"]["name"]["stringValue"],
            e["fields"]["url"]["stringValue"])));
  }

  @override
  initState() {
    super.initState();
    loadURLPresets();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      const Text("Presets:"),
      ...loadedURLPresets.entries
          .map((e) => ListTile(
                title: Text(e.key),
                subtitle: Text(e.value),
                onTap: () {
                  widget.propertyKey.send(value: e.value);
                },
              ))
          .toList(),
    ]);
    // return StreamBuilder(
    //     stream:
    //         FirebaseFirestore.instance.collection('preset-urls').snapshots(),
    //     builder: (context, snapshot) {
    //       if (snapshot.hasError) {
    //         debugPrint(snapshot.error.toString());
    //         return const Text('Something went wrong retrieving preset urls :(');
    //       }
    //       if (!snapshot.hasData) {
    //         return const Text("Loading preset urls ...");
    //       }
    //       assert(snapshot.data?.docs != null);
    //       return Column(
    //           children: snapshot.data!.docs.map((doc) {
    //         assert(doc['name'] != null);
    //         assert(doc['url'] != null);
    //         return ListTile(
    //           title: Text(doc['name']),
    //           onTap: () {
    //             propertyKey.send(value: doc['url']);
    //           },
    //         );
    //       }).toList());
    //     });
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
        Padding(
            padding: const EdgeInsets.all(7),
            child: Card(child: Text(isLocked ? "Locked" : "Unlocked!"))),
        TextField(
          onChanged: (text) {
            if (text == "cheat") {
              setState(() {
                isLocked = false;
              });
            }
            if (isLocked) {
            } else {
              widget.propertyKey.send(value: text);
            }
          },
          decoration: const InputDecoration(
            hintText: "Enter password to unlock",
          ),
        ),
      ],
    );
  }
}
