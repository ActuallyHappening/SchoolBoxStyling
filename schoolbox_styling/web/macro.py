def main():
  replace_in_file("content.js", 'Object.defineProperty(exports, "__esModule", { value: true });', "// Replaced by macro.py")
  replace_in_file("popup.js", 'Object.defineProperty(exports, "__esModule", { value: true });', "// Replaced by macro.py")


def replace_in_file(fileName: str, old: str, new: str):
  t = open(fileName, "r").read()
  # print(t)
  t = t.replace(old, new)
  # print(t)
  open(fileName, "w").write(t)