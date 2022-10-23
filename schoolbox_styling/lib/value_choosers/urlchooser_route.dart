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
            showPresets: PresetOptions.customList,
          )),
  ValueChooser(
      name: "Image (GIFs)",
      body: (key) => (context) => GenericURLChooserBody(
            propertyKey: key,
            showPresets: PresetOptions.tenorAPI,
          )),
];

enum PresetOptions {
  none,
  customList,
  tenorAPI,
}

class GenericURLChooserBody extends StatelessWidget {
  const GenericURLChooserBody(
      {super.key,
      required this.propertyKey,
      this.showPresets = PresetOptions.none});

  final KnownKey propertyKey;
  final PresetOptions showPresets;

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
        if (showPresets == PresetOptions.customList)
          FireStorePresetURLs(propertyKey: propertyKey),
      ],
    );
  }
}

class TenorAPIPresetURLS extends StatefulWidget {
  const TenorAPIPresetURLS({super.key});

  @override
  State<TenorAPIPresetURLS> createState() => _TenorAPIPresetURLSState();
}

class _TenorAPIPresetURLSState extends State<TenorAPIPresetURLS> {
  @override
  Widget build(BuildContext context) {
    return Container();
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
        // ignore: avoid_print
        print("Setting preset URLS: $value");
        loadedURLPresets = value;
      });
    });
  }

  Future<Map<String, String>> getURLPresets() async {
    // Using dio
    // return Dio().get("https://schoolbox-website.web.app/presets.json").then((value) => value.data);
    const String projectID = "better-schoolbox-1f647";
    const String collectionID = "preset-urls";
    final rawData = await dio.get(
        "https://firestore.googleapis.com/v1/projects/$projectID/databases/(default)/documents/$collectionID");
    final List<dynamic> documentsData = rawData.data["documents"];

    // debugPrint("Got value: $documentsData");
    final Map<String, String> data = {};

    for (var presetReceived in documentsData) {
      final fields = presetReceived["fields"]!;
      final name = fields["name"]["stringValue"];
      final url = fields["url"]["stringValue"];
      data[name] = url;
    }

    // debugPrint("Finished data: $data");
    return data;
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
          .map((e) => URLPresetOption(
              url: e.value, name: e.key, propertyKey: widget.propertyKey))
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

class URLPresetOption extends StatelessWidget {
  const URLPresetOption(
      {super.key,
      required this.url,
      required this.name,
      this.author,
      required this.propertyKey});

  final String url;
  final String name;
  final KnownKey propertyKey;
  final String? author;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(name),
      subtitle: author != null ? Text("By $author") : Text("URL: $url"),
      onTap: () => propertyKey.send(value: url),
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
