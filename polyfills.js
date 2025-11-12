// Polyfill para socket.io-client en React Native
global.process = global.process || require("process");
global.Buffer = global.Buffer || require("buffer").Buffer;

if (typeof btoa === "undefined") {
  global.btoa = function (str) {
    return Buffer.from(str, "binary").toString("base64");
  };
}

if (typeof atob === "undefined") {
  global.atob = function (b64Encoded) {
    return Buffer.from(b64Encoded, "base64").toString("binary");
  };
}
