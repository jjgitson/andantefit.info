// Render react-icons to PNG data URIs at high resolution, tinted a given color.
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fi = require("react-icons/fi");
const Fa = require("react-icons/fa");

async function renderIcon(IconComp, hex, size = 320) {
  let svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComp, { color: "#" + hex, size: size, strokeWidth: 2 })
  );
  // Ensure explicit width/height for sharp rasterization
  const buf = await sharp(Buffer.from(svg)).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

async function buildIconSet(colorMap) {
  // colorMap: { name: [IconComponent, hex] }
  const out = {};
  for (const [name, [comp, hex]] of Object.entries(colorMap)) {
    out[name] = await renderIcon(comp, hex);
  }
  return out;
}

module.exports = { renderIcon, buildIconSet, Fi, Fa };
