"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getIcon = getIcon;

var _dom = require("../dom");

var svgCollection = null;
var svgBuilt = Object.create(null);

var SVG = "http://www.w3.org/2000/svg";
var XLINK = "http://www.w3.org/1999/xlink";

var prefix = "ProseMirror-icon";

function getIcon(name, data) {
  var node = document.createElement("div");
  node.className = prefix;
  if (data.path) {
    if (!svgBuilt[name]) buildSVG(name, data);
    var svg = node.appendChild(document.createElementNS(SVG, "svg"));
    svg.style.width = data.width / data.height + "em";
    var use = svg.appendChild(document.createElementNS(SVG, "use"));
    use.setAttributeNS(XLINK, "href", /([^#]*)/.exec(document.location)[1] + "#pm-icon-" + name);
  } else if (data.dom) {
    node.appendChild(data.dom.cloneNode(true));
  } else {
    node.appendChild(document.createElement("span")).textContent = data.text || '';
    if (data.style) node.firstChild.style.cssText = data.style;
  }
  return node;
}

function buildSVG(name, data) {
  if (!svgCollection) {
    svgCollection = document.createElementNS(SVG, "svg");
    svgCollection.style.display = "none";
    document.body.insertBefore(svgCollection, document.body.firstChild);
  }
  var sym = document.createElementNS(SVG, "symbol");
  sym.id = "pm-icon-" + name;
  sym.setAttribute("viewBox", "0 0 " + data.width + " " + data.height);
  var path = sym.appendChild(document.createElementNS(SVG, "path"));
  path.setAttribute("d", data.path);
  svgCollection.appendChild(sym);
  svgBuilt[name] = true;
}

(0, _dom.insertCSS)("\n." + prefix + " {\n  display: inline-block;\n  line-height: .8;\n  vertical-align: -2px; /* Compensate for padding */\n  padding: 2px 8px;\n  cursor: pointer;\n}\n\n." + prefix + " svg {\n  fill: currentColor;\n  height: 1em;\n}\n\n." + prefix + " span {\n  vertical-align: text-top;\n}");