import * as wasm_exec from "./wasm_exec.js";

var shcrypto_wasm;

export function init(wasm_url) {
  const go = new Go();
  if ("instantiateStreaming" in WebAssembly) {
    WebAssembly.instantiateStreaming(fetch(wasm_url), go.importObject).then(
      function (obj) {
        shcrypto_wasm = obj.instance;
        go.run(shcrypto_wasm);
      }
    );
  } else {
    fetch(wasm_url)
      .then((resp) => resp.arrayBuffer())
      .then((bytes) =>
        WebAssembly.instantiate(bytes, go.importObject).then(function (obj) {
          shcrypto_wasm = obj.instance;
          go.run(shcrypto_wasm);
        })
      );
  }
}

export function encrypt(message, eonPublicKey, epochID, sigma) {
  return window.shcrypto_encrypt(message, eonPublicKey, epochID, sigma);
}

export function decrypt(encryptedMessage, decryptionKey) {
  return window.shcrypto_decrypt(encryptedMessage, decryptionKey);
}

export function verifyDecryptionKey(decryptionKey, eonPublicKey, epochID) {
  return window.shcrypto_verifyDecryptionKey(
    decryptionKey,
    eonPublicKey,
    epochID
  );
}
