let fallbackCounter = 0;

function formatUuidFromBytes(bytes: Uint8Array) {
  const uuidBytes = bytes.slice(0, 16);
  uuidBytes[6] = (uuidBytes[6] & 0x0f) | 0x40;
  uuidBytes[8] = (uuidBytes[8] & 0x3f) | 0x80;
  const hex = Array.from(uuidBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function createPseudoRandomBytes(length: number) {
  fallbackCounter += 1;
  let seed = (Date.now() + fallbackCounter * 2654435761 + Math.floor(Math.random() * 2 ** 16)) >>> 0;
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    bytes[index] = seed & 0xff;
  }

  return bytes;
}

export function createUuid() {
  const webCrypto = globalThis.crypto;

  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID();
  }

  if (webCrypto && typeof webCrypto.getRandomValues === "function") {
    return formatUuidFromBytes(webCrypto.getRandomValues(new Uint8Array(16)));
  }

  return formatUuidFromBytes(createPseudoRandomBytes(16));
}

export function createId(prefix: string) {
  return `${prefix}_${createUuid()}`;
}
