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

class FireStorePresetURLs extends StatelessWidget {
  const FireStorePresetURLs({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  Widget build(BuildContext context) {
    return Column()
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
