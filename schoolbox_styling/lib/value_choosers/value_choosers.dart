import 'package:flutter/material.dart';
import 'package:schoolbox_styling/constants.dart';
import 'package:schoolbox_styling/routes/drawer.dart';
import 'package:schoolbox_styling/value_choosers/colour_picker.dart';
import 'package:schoolbox_styling/value_choosers/urlchooser_route.dart';

class ValueChooser {
  ValueChooser({
    required this.name,
    required this.body,
  });

  final String name;
  final WidgetBuilder Function(KnownKey key) body;
}

List<ValueChooser> valueChoosers = [
  ...urlValueChoosers,
  ...colourValueChoosers,
];

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
        initialIndex: 1,
        child: Scaffold(
            body: TabBarView(
                children:
                    bodies.map((constructor) => constructor(context)).toList()),
            drawer: const MyAppDrawer(),
            appBar: AppBar(
                title: Text(propertyKey.routeTitle),
                bottom: TabBar(
                    isScrollable: true,
                    tabs: names.map((name) => Tab(text: name)).toList()))));
  }
}
