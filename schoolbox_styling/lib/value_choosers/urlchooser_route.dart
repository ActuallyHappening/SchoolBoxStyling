import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:schoolbox_styling/secrets.dart';

import './value_choosers.dart';
import '../constants.dart';
import '../js_integration.dart';

List<ValueChooser> urlValueChoosers = [
  ValueChooser(
      name: "Custom Image",
      body: (key) => (context) => CustomGIFValueChooser(
            propertyKey: key,
          )),
  ValueChooser(
      name: "✨ Online GIFs ✨",
      body: (key) => (context) => OnlineGIFValueChooser(
            propertyKey: key,
          )),
];

enum PresetOptions {
  none,
  customList,
  tenorAPI,
}

// #region GENERIC TODO: REMOVE
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
// #endregion

class CustomGIFValueChooser extends StatelessWidget {
  const CustomGIFValueChooser({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(10), children: [
      ...GenericURLChooserBody.others,
      Center(
          child: URLInputFieldWithPassword(
        propertyKey: propertyKey,
      )),
      // const Divider(indent: 10, endIndent: 10, ),
      const SizedBox(
        height: 20,
      ),
      FireStorePresetURLs(propertyKey: propertyKey),
    ]);
  }
}

class OnlineGIFValueChooser extends StatelessWidget {
  const OnlineGIFValueChooser({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  static const List<Widget> others = [
    Text("✨ Search for the perfect gif! ✨"),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(10), children: [
      ...others,
      TenorAPIPresetURLS(propertyKey: propertyKey, search: true)
    ]);
  }
}

class TenorAPIPresetURLS extends StatefulWidget {
  const TenorAPIPresetURLS(
      {super.key, required this.propertyKey, this.search = true});

  final KnownKey propertyKey;
  final bool search;

  @override
  State<TenorAPIPresetURLS> createState() => _TenorAPIPresetURLSState();
}

class _TenorAPIPresetURLSState extends State<TenorAPIPresetURLS> {
  List<PresetURLInfo> loadedURLPresets = [];

  var dio = Dio();
  final int limit = 150;

  loadURLPresets() {
    getURLPresets().then((value) {
      setState(() {
        // ignore: avoid_print
        print("Setting preset tenor URLS: $value");
        loadedURLPresets = value;
      });
    });
  }

  loadURLFromSearch(String searchStr) {
    getURLFromSearch(searchStr).then((value) {
      setState(() {
        // ignore: avoid_print
        print("Setting preset tenor URLS after search '$searchStr': $value");
        loadedURLPresets = value;
      });
    });
  }

  // getURLFromSearch
  Future<List<PresetURLInfo>> getURLFromSearch(String searchStr) async {
    var response = await dio.get(
        "https://api.tenor.com/v2/search?q=$searchStr&key=$TENOR_API_KEY&limit=$limit&client_key=better_schoolbox_onlinegifpage");

    return extractPresetURLInfoFromTenorAPIResponse(response);
  }

  Future<List<PresetURLInfo>> getURLPresets() async {
    final res = await dio.get(
        "https://tenor.googleapis.com/v2/featured?key=$TENOR_API_KEY&limit=$limit&client_key=better_schoolbox_onlinegifpage");

    return extractPresetURLInfoFromTenorAPIResponse(res);
  }

  /// Use this to extract URLs from a tenor API response
  List<PresetURLInfo> extractPresetURLInfoFromTenorAPIResponse(dynamic resp) {
    final List<PresetURLInfo> data = [];

    final List json = resp.data["results"];

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
      final String? tinyGifURL = mediaFormats["tinygif"]?["url"];
      data.add(PresetURLInfo(
          name: title, url: gifUrl, previewURL: tinyGifURL ?? gifUrl));
    }

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
      !widget.search
          ? const Text("Trending GIFs (from tenor): ")
          : TextField(
              onChanged: (value) {
                if (value == "") {
                  loadURLPresets();
                } else {
                  loadURLFromSearch(value);
                }
              },
              decoration: const InputDecoration(
                hintText: "Search for GIFs - powered by Tenor",
              ),
            ),
      ...loadedURLPresets
          .map((e) =>
              URLPresetOption(presetInfo: e, propertyKey: widget.propertyKey))
          .toList(),
    ]);
  }
}

// #region Firebase
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

  Future<List<dynamic>> _getSpecifiedNumber(int number) async {
    const String projectID = "better-schoolbox-1f647";
    const String collectionID = "preset-urls";
    final List<dynamic> documentsData = [];

    final String url =
        "https://firestore.googleapis.com/v1/projects/$projectID/databases/(default)/documents/$collectionID?pageSize=$number";

    // repeat get until we have enough
    String? nextPageToken;
    while (documentsData.length < number) {
      final response = await dio
          .get(nextPageToken != null ? "$url?pageToken=$nextPageToken" : url);
      nextPageToken = response.data["nextPageToken"];

      final List<dynamic> documents = response.data["documents"];
      documentsData.addAll(documents);
      if (nextPageToken == null) {
        print(
            "No more pages, stopping at ${documentsData.length} documents, aiming for $number");
        break;
      }

      print(
          "Fetched ${documents.length} documents, have a total of ${documentsData.length} documents, aiming for $number");
    }

    return documentsData;
  }

  Future<List<PresetURLInfo>> getURLPresets() async {
    const int limit = 200;
    final List<dynamic> documentsData = await _getSpecifiedNumber(limit);

// https://firestore.googleapis.com/v1/projects/better-schoolbox-1f647/databases/(default)/documents/preset-urls

    // debugPrint("Got value: $documentsData");
    final List<PresetURLInfo> data = [];

    for (var presetReceived in documentsData) {
      final fields = presetReceived["fields"]!;
      final name = fields["name"]["stringValue"];
      final url = fields["url"]["stringValue"];
      final author = fields["author"]?["stringValue"];
      data.add(PresetURLInfo(name: name, url: url, author: author));
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
      const Text("Custom GIFs collated by the community:"),
      const SizedBox(height: 15),
      ...loadedURLPresets
          .map((e) =>
              URLPresetOption(presetInfo: e, propertyKey: widget.propertyKey))
          .toList(),
      const SizedBox(height: 15),
      const Text(
          "Want to add your own? Contact me on discord: Actually Happening#4909; Or, by email: 23269@students.emmanuel.qld.edu.au"),
    ]);
  }
}
// #endregion

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
      onTap: () => propertyKey.sendBackgroundURL(url: presetInfo.url),
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
  final TextEditingController controller = TextEditingController();

  // static const spicyDefault = "https://picsum.photos/420/690";
  static const spicyDefault =
      "https://media.tenor.com/CWgfFh7ozHkAAAAC/rick-astly-rick-rolled.gif";

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(7),
          child: Card(
            // color: Theme.of(context).primaryColor.withAlpha(0x20),
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Text(
                isLocked ? "Locked" : "Unlocked!",
                style: TextStyle(color: isLocked ? Colors.red : Colors.green),
              ),
            ),
          ),
        ),
        TextField(
          controller: controller,
          onChanged: (text) {
            if (text == "cheat") {
              controller.text = spicyDefault;
              widget.propertyKey.sendBackgroundURL(url: spicyDefault);
              setState(() {
                isLocked = false;
              });
            } else if (!isLocked) {
              widget.propertyKey.sendBackgroundURL(url: text);
            }
          },
          decoration: InputDecoration(
            hintText: isLocked
                ? "Enter password to unlock"
                : "Right click GIF/Image, select 'copy image address', paste here 😀",
          ),
        ),
      ],
    );
  }
}
