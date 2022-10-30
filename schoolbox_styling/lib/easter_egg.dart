import 'package:flutter/cupertino.dart';

class EasterEggState extends ChangeNotifier {
  bool _eggEnabled = false;
  bool get eggEnabled => _eggEnabled;
  set eggEnabled(bool value) {
    _eggEnabled = value;
    notifyListeners();
  }
}
