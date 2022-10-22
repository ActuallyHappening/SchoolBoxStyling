import 'package:flutter/material.dart';
import 'package:schoolbox_styling/constants.dart';
import 'package:schoolbox_styling/value_chosers/colour_picker.dart';

class ValueChooser {
  ValueChooser({
    required this.name,
    required this.body,
  });

  final String name;
  final WidgetBuilder Function(KnownKey key) body;
}

List<ValueChooser> valueChoosers = [...colourValueChoosers];

class AllValueChoosersRoute extends StatelessWidget {
  const AllValueChoosersRoute({super.key, required this.propertyKey});

  final KnownKey propertyKey;

  @override
  Widget build(BuildContext context) {
    List<String> names = valueChoosers.map((e) => e.name).toList();
    List<WidgetBuilder> bodies =
        valueChoosers.map((chooser) => chooser.body(propertyKey)).toList();
    return DefaultTabController(
        length: valueChoosers.length,
        child: Scaffold(
            body: TabBarView(
                children:
                    bodies.map((constructor) => constructor(context)).toList()),
            appBar: AppBar(
                title: Text(propertyKey.routeTitle),
                bottom: TabBar(
                    tabs: names.map((name) => Tab(text: name)).toList()))));
  }
}
