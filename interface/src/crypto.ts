import * as shcrypto from "./shcrypto";
import { ethers } from "ethers";

shcrypto.init(import.meta.env.VITE_SHCRYPTO_WASM_URL);

const passphraseChars =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const eonKey = ethers.utils.arrayify(import.meta.env.VITE_EON_KEY);

export function randomPassphrase(length: number): string {
  let p = "";
  for (let i = 0; i < length; i++) {
    const charIndex = Math.floor(Math.random() * passphraseChars.length);
    p += passphraseChars.charAt(charIndex);
  }
  return p;
}

export async function encrypt(
  plaintext: string,
  phase: number,
  passphrase: string
): Promise<string> {
  const epoch = phaseToEpoch(phase);
  const sigma = passphraseToSigma(passphrase, phase);
  const ciphertext = await shcrypto.encrypt(
    ethers.utils.toUtf8Bytes(plaintext),
    eonKey,
    epoch,
    sigma
  );
  if (!ciphertext.startsWith("0x")) {
    throw new Error(ciphertext);
  }
  return ciphertext;
}

function phaseToEpoch(phase: number): Uint8Array {
  const big = ethers.BigNumber.from(phase);
  const hex = big.toHexString();
  const padded = ethers.utils.zeroPad(hex, 8);
  return padded;
}

function passphraseToSigma(passphrase: string, phase: number): Uint8Array {
  const passphraseHash = ethers.utils.keccak256(
    ethers.utils.toUtf8Bytes(passphrase)
  );
  const sigmaPreimage = ethers.utils.concat([
    ethers.utils.arrayify(passphraseHash),
    ethers.utils.arrayify(ethers.BigNumber.from(phase).toHexString()),
  ]);
  const sigma = ethers.utils.keccak256(sigmaPreimage);
  return ethers.utils.arrayify(sigma);
}
