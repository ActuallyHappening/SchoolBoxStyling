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

class CustomGIFValueChooser extends StatelessWidget {
  const CustomGIFValueChooser({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  Widget build(BuildContext context) {
    return ListView(padding: const EdgeInsets.all(10), children: [
      const Text(
          "As this feature can be abused, a password is required. Ask around, or join the discord server to be told."),
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
    return ListView(
        padding: const EdgeInsets.all(10),
        children: [...others, TenorAPIDisplay(propertyKey: propertyKey)]);
  }
}

class TenorAPIDisplay extends StatefulWidget {
  const TenorAPIDisplay({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  /// Maximum number of featured tenor icons can be displayed
  static const maxNum = 200;

  @override
  State<TenorAPIDisplay> createState() => _TenorAPIDisplayState();
}

class _TenorAPIDisplayState extends State<TenorAPIDisplay> {
  List<PresetURLInfo> loadedURLPresets = [];
  String queryMsg = "Type to start searching! Loading featured GIFs ...";

  final dio = Dio();
  int limit = 25;

  /// Load into state urls from featured GIFs on tenor
  loadURLFeatured() {
    getURLPresets().then((value) {
      setState(() {
        // ignore: avoid_print
        print("Setting preset tenor URLS: $value");
        loadedURLPresets = value;
        queryMsg = "Type to start searching! Showing featured GIFs";
      });
    });
  }

  /// Loads into state urls from searching the tenor api
  loadURLFromSearch(String searchStr) {
    getURLFromSearch(searchStr).then((value) {
      setState(() {
        // ignore: avoid_print
        print("Setting preset tenor URLS after search '$searchStr': $value");
        loadedURLPresets = value;
        queryMsg = "Showing results for '$searchStr'";
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

    print("Number of extracted urls: ${data.length}");

    return data;
  }

  String _currentInput = "";

  /// Update the state with the current input
  updateFromInput(String value) {
    _currentInput = value;
    if (value == "") {
      loadURLFeatured();
    } else {
      loadURLFromSearch(value);
    }
  }

  @override
  initState() {
    super.initState();
    loadURLFeatured();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      TextField(
        onChanged: updateFromInput,
        decoration: const InputDecoration(
          hintText: "Search for GIFs - powered by Tenor",
        ),
      ),
      Text(queryMsg),
      // SizedBox(
      //   height: MediaQuery.of(context).size.height * 0.5,
      //   child: GridView.count(
      //     // Create a grid with 2 columns. If you change the scrollDirection to
      //     // horizontal, this produces 2 rows.
      //     crossAxisCount: 3,
      //     // shrinkWrap: true,

      //     // Generate 100 widgets that display their index in the List.
      //     children: List.generate(loadedURLPresets.length, (index) {
      //       return URLPresetOption(
      //           large: true,
      //           presetInfo: loadedURLPresets[index],
      //           propertyKey: widget.propertyKey);
      //     }),
      //   ),
      // ),
      const Spacer(),
      (limit < TenorAPIDisplay.maxNum)
          ? ElevatedButton(
              onPressed: () {
                limit += 25;
                updateFromInput(_currentInput);
              },
              child: const Text("Load more"))
          : const Text("Potential feature: infinite scrolling?")
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
      {super.key,
      required this.presetInfo,
      required this.propertyKey,
      this.large = false});

  final PresetURLInfo presetInfo;
  final KnownKey propertyKey;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final img = Image.network(presetInfo.previewURL ?? presetInfo.url);
    return large
        ? img
        : ListTile(
      title: Text(presetInfo.name),
      subtitle: Text(presetInfo.subTitle),
      onTap: () => propertyKey.sendBackgroundURL(url: presetInfo.url),
            leading: img,
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
