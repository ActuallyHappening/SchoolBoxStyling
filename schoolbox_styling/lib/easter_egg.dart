import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class EasterEggState extends ChangeNotifier {
  EasterEggState() {
    _load();
  }

  _load() async {
    prefs = await _prefs;
    _eggEnabled = prefs.getBool("easterEggEnabled") ?? false;
    notifyListeners();
  }

  bool _eggEnabled = false;
  bool get eggEnabled => _eggEnabled;

  final Future<SharedPreferences> _prefs = SharedPreferences.getInstance();
  late SharedPreferences prefs;

  static const initial = "<initial>";
  static const String password = "cheatisthepassword";

  String currentTypedText = initial;

  void addLetter(String letter) {
    currentTypedText = "$currentTypedText$letter";

    if (currentTypedText == password) {
      _eggEnabled = true;
      prefs.setBool("easterEggEnabled", true);
    } else {
      // check if typed letters are the beginning of the password
      if (!password.startsWith(currentTypedText)) {
        currentTypedText = initial;
      }
    }
    
    notifyListeners();
  }

  set eggEnabled(bool value) {
    _eggEnabled = value;

    notifyListeners();
  }
}

class EasterEggTextGuesser extends StatefulWidget {
  const EasterEggTextGuesser({super.key, required this.textPrefix});
  final String textPrefix;

  @override
  State<EasterEggTextGuesser> createState() => _EasterEggTextGuesserState();
}

class _EasterEggTextGuesserState extends State<EasterEggTextGuesser> {
  final keyboard = HardwareKeyboard();

  bool handler(KeyEvent event) {
    debugPrint("$event");
    if (event is KeyDownEvent) {
      final key = event.character;
      if (key != null) {
        context.read<EasterEggState>().addLetter(key);
      }
    }
    return false;
  }

  @override
  void initState() {
    super.initState();
    keyboard.addHandler(handler);
  }

  @override
  void dispose() {
    keyboard.removeHandler(handler);
    // TODO: implement dispose
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<EasterEggState>(builder: (context, eggState, _) {
      return Text("${widget.textPrefix} ... ${eggState.currentTypedText}");
    });
  }
}
