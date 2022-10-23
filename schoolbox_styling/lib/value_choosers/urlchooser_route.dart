import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:schoolbox_styling/secrets.dart';

import './value_choosers.dart';
import '../constants.dart';
import '../js_integration.dart';

List<ValueChooser> urlValueChoosers = [
  ValueChooser(
      name: "Custom Image",
      body: (key) => (context) => GenericURLChooserBody(
            propertyKey: key,
            showPresets: PresetOptions.customList,
          )),
  ValueChooser(
      name: "Online GIFs",
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
        if (showPresets == PresetOptions.tenorAPI)
          TenorAPIPresetURLS(propertyKey: propertyKey),
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
  List<PresetURLInfo> loadedURLPresets = [];

  var dio = Dio();

  loadURLPresets() {
    getURLPresets().then((value) {
      setState(() {
        // ignore: avoid_print
        print("Setting preset tenor URLS: $value");
        loadedURLPresets = value;
      });
    });
  }

  Future<List<PresetURLInfo>> getURLPresets() async {
    // Using tenor

    final List<PresetURLInfo> data = [];

    final res = await dio.get(
        "https://tenor.googleapis.com/v2/featured?key=$TENOR_API_KEY&limit=10&client_key=better_schoolbox_gifpage");

    final List json = res.data["results"];

    // debugPrint("Res from dio: $json");
    for (var element in json) {
      // debugPrint("Element: $element;; title: ${element["title"]}");
      final String title = element["title"];
      final mediaFormats = Map<String, dynamic>.from(element["media_formats"]);
      final gifResult = mediaFormats["gif"];
      if (gifResult == null) {
        debugPrint(
            "No gif result for '$title' tenor request: ${mediaFormats.keys}");
        continue;
      }
      final gifUrl = gifResult["url"];
      if (gifUrl == null) {
        debugPrint("No gif url for '$title' tenor request: $gifResult");
        continue;
      }
      data.add(PresetURLInfo(name: title, url: gifUrl, previewURL: gifUrl));
    }

    // if (res != null) {
    //   print("Tenor API request succeeded: $res");
    //   for (var tenorResult in res.results) {
    //     var title = tenorResult.title;
    //     var media = tenorResult.media;
    //     debugPrint(
    //         '$title: gif : ${media?.gif?.previewUrl?.toString()} : raw: $tenorResult');
    //     if (media?.gif == null) {
    //       debugPrint("No gif found for $tenorResult");
    //       continue;
    //     }
    //     assert(media?.gif != null);
    //     if (media!.gif?.url == null) {
    //       debugPrint("No gif url found for $tenorResult");
    //       continue;
    //     }
    //     assert(media.gif?.url != null);
    //     if (media.gif?.previewUrl == null) {
    //       debugPrint("No gif preview url found for $tenorResult");
    //       continue;
    //     }
    //     assert(media.gif?.previewUrl != null);
    //     data.add(PresetURLInfo(
    //         url: media.gif!.url!,
    //         name: tenorResult.title!,
    //         author: null,
    //         previewURL: media.gif!.previewUrl));
    //   }
    // }

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
      const Text("Trending GIFs (from tenor): "),
      ...loadedURLPresets
          .map((e) =>
              URLPresetOption(presetInfo: e, propertyKey: widget.propertyKey))
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
  List<PresetURLInfo> loadedURLPresets = [];

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

  Future<List<PresetURLInfo>> getURLPresets() async {
    // Using dio
    // return Dio().get("https://schoolbox-website.web.app/presets.json").then((value) => value.data);
    const String projectID = "better-schoolbox-1f647";
    const String collectionID = "preset-urls";
    final rawData = await dio.get(
        "https://firestore.googleapis.com/v1/projects/$projectID/databases/(default)/documents/$collectionID");
    final List<dynamic> documentsData = rawData.data["documents"];

    // debugPrint("Got value: $documentsData");
    final List<PresetURLInfo> data = [];

    for (var presetReceived in documentsData) {
      final fields = presetReceived["fields"]!;
      final name = fields["name"]["stringValue"];
      final url = fields["url"]["stringValue"];
      // TODO: Add author param here
      data.add(PresetURLInfo(name: name, url: url));
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
      ...loadedURLPresets
          .map((e) =>
              URLPresetOption(presetInfo: e, propertyKey: widget.propertyKey))
          .toList(),
    ]);
  }
}

class PresetURLInfo {
  const PresetURLInfo(
      {required this.name, required this.url, this.previewURL, this.author});
  final String url;
  final String name;
  final String? previewURL;
  final String? author;

  String get subTitle {
    if (author != null) {
      return "By $author";
    }
    return "URL: $url";
  }
}

class URLPresetOption extends StatelessWidget {
  const URLPresetOption(
      {super.key, required this.presetInfo, required this.propertyKey});

  final PresetURLInfo presetInfo;
  final KnownKey propertyKey;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(presetInfo.name),
      subtitle: Text(presetInfo.subTitle),
      onTap: () => propertyKey.send(value: presetInfo.url),
      leading: Image.network(presetInfo.previewURL ?? presetInfo.url),
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
