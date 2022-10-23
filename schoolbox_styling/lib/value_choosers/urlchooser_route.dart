import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:schoolbox_styling/secrets.dart';
import 'package:tenor/tenor.dart';

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

  static List<Widget> others = const [
    Text(
        "As this feature can be abused, a password is required. Hint: My OneNote"),
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
  const TenorAPIPresetURLS({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  State<TenorAPIPresetURLS> createState() => _TenorAPIPresetURLSState();
}

class _TenorAPIPresetURLSState extends State<TenorAPIPresetURLS> {
  Map<String, String> loadedURLPresets = {};

  var tenor = Tenor(apiKey: TENOR_API_KEY);

  loadURLPresets() {
    getURLPresets().then((value) {
      setState(() {
        // ignore: avoid_print
        print("Setting preset tenor URLS: $value");
        loadedURLPresets = value;
      });
    });
  }

  Future<Map<String, String>> getURLPresets() async {
    // Using tenor
    TenorResponse? res = await tenor.requestTrendingGIF(limit: 5);
    if (res == null) {
      // ignore: avoid_print
      print("Tenor API request failed: $res");
      return {};
    }
    for (var tenorResult in res.results) {
      var title = tenorResult.title;
      var media = tenorResult.media;
      print(
          '$title: gif : ${media?.gif?.previewUrl?.toString()} : raw: $tenorResult');
    }

    // debugPrint("Got value: $documentsData");
    final Map<String, String> data = {};

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
  }
}

class FireStorePresetURLs extends StatefulWidget {
  const FireStorePresetURLs({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  State<FireStorePresetURLs> createState() => _FireStorePresetURLsState();
}

class _FireStorePresetURLsState extends State<FireStorePresetURLs> {
  Map<String, String> loadedURLPresets = {"Loading ...": ""};

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
