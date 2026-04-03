import { existsSync, renameSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const packageDir = path.resolve("node_modules", "tinyglobby");
const indexJsPath = path.join(packageDir, "index.js");
const distModulePath = path.join(packageDir, "dist", "index.mjs");

if (!existsSync(packageDir) || existsSync(indexJsPath) || !existsSync(distModulePath)) {
  // Keep going so the other dependency repair can still run.
} else {
  const deletedPackageJson = path.join(
    packageDir,
    "package.json.DELETE.a7ce60573d5f9ccb7172ea0c7b6eba6a"
  );
  const packageJsonPath = path.join(packageDir, "package.json");

  if (!existsSync(packageJsonPath) && existsSync(deletedPackageJson)) {
    renameSync(deletedPackageJson, packageJsonPath);
  }

  writeFileSync(indexJsPath, 'export * from "./dist/index.mjs";\n');
}

const selectorParserClassPath = path.resolve(
  "node_modules",
  "postcss-selector-parser",
  "dist",
  "selectors",
  "className.js"
);

if (
  existsSync(selectorParserClassPath) &&
  statSync(selectorParserClassPath).size === 0
) {
  writeFileSync(
    selectorParserClassPath,
    `"use strict";

exports.__esModule = true;
exports["default"] = void 0;
var _node = _interopRequireDefault(require("./node"));
var _types = require("./types");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }
function _inheritsLoose(subClass, superClass) { subClass.prototype = Object.create(superClass.prototype); subClass.prototype.constructor = subClass; _setPrototypeOf(subClass, superClass); }
function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }
var ClassName = /*#__PURE__*/function (_Node) {
  _inheritsLoose(ClassName, _Node);
  function ClassName(opts) {
    var _this;
    _this = _Node.call(this, opts) || this;
    _this.type = _types.CLASS;
    return _this;
  }
  var _proto = ClassName.prototype;
  _proto.valueToString = function valueToString() {
    return '.' + _Node.prototype.valueToString.call(this);
  };
  return ClassName;
}(_node["default"]);
exports["default"] = ClassName;
module.exports = exports.default;
`
  );
}
