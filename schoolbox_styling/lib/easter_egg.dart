import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class EasterEggState extends ChangeNotifier {
  EasterEggState() {
    _load();
  }

  _load() async {
    final prefs = await _prefs;
    _eggEnabled = prefs.getBool("easterEggEnabled") ?? false;
    notifyListeners();
  }

  bool _eggEnabled = false;
  bool get eggEnabled => _eggEnabled;
  final Future<SharedPreferences> _prefs = SharedPreferences.getInstance();

  set eggEnabled(bool value) {
    _eggEnabled = value;

    notifyListeners();
  }
}

class EasterEggTextGuesser extends StatelessWidget {
  const EasterEggTextGuesser({super.key, required this.textPrefix});
  final String textPrefix;

  @override
  Widget build(BuildContext context) {
    return Consumer(builder: (context, eggState, _) {
      return Text("$textPrefix ...");
    });
  }
}
