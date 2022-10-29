import 'package:dio/dio.dart';

class HttpAPI {
  final dio = Dio();
  Future get(String url) async {
    var response = await dio.get(url);
    return response;
  }

  /// TODO: experiment with data property, usage unkonwn
  Future post(String url, {data}) async {
    var response = await dio.post(url, data: data);
    return response;
  }
}

enum FirebaseCollectionIDs {
  defaultConfig,
  presetURLs,
  presetValues,
}

extension FirebaseCollectionIDsExt on FirebaseCollectionIDs {
  String get collectionID => {
        FirebaseCollectionIDs.defaultConfig: "default-config",
        FirebaseCollectionIDs.presetURLs: "preset-urls",
        FirebaseCollectionIDs.presetValues: "preset-values",
      }[this]!;
}

class BasicFirebaseAPI {
  final HttpAPI httpAPI;
  BasicFirebaseAPI({required this.httpAPI});

  static const String projectID = "better-schoolbox-1f647";
  // static const String collectionID = "preset-urls";
  static const String urlPrefix =
      "https://firestore.googleapis.com/v1/projects/$projectID/databases/(default)/documents/";

  static String formDocumentURL({required FirebaseCollectionIDs collectionID}) {
    return urlPrefix + collectionID.collectionID;
  }
}

// Future<List<PresetURLInfo>> getURLPresets() async {
//   // Using dio
//   // return Dio().get("https://schoolbox-website.web.app/presets.json").then((value) => value.data);
//   const String projectID = "better-schoolbox-1f647";
//   const String collectionID = "preset-urls";
//   final rawData = await dio.get(
//       "https://firestore.googleapis.com/v1/projects/$projectID/databases/(default)/documents/$collectionID");
//   final List<dynamic> documentsData = rawData.data["documents"];

//   // debugPrint("Got value: $documentsData");
//   final List<PresetURLInfo> data = [];

//   for (var presetReceived in documentsData) {
//     final fields = presetReceived["fields"]!;
//     final name = fields["name"]["stringValue"];
//     final url = fields["url"]["stringValue"];
//     final author = fields["author"]?["stringValue"];
//     data.add(PresetURLInfo(name: name, url: url, author: author));
//   }

//   // debugPrint("Finished data: $data");
//   return data;
// }
