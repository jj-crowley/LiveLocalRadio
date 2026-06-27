import fs from "node:fs";

const bitrateTable = {
  "1:1": [0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448],
  "1:2": [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384],
  "1:3": [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  "2:1": [0, 32, 48, 56, 64, 80, 96, 112, 128, 144, 160, 176, 192, 224, 256],
  "2:2": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
  "2:3": [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]
};

const sampleRates = {
  0: [44100, 22050, 11025],
  1: [48000, 24000, 12000],
  2: [32000, 16000, 8000]
};

export function getMp3DurationSeconds(filePath) {
  const buffer = fs.readFileSync(filePath);
  const start = skipId3(buffer);
  const headerOffset = findFrameHeader(buffer, start);

  if (headerOffset < 0) {
    return 180;
  }

  const header = parseFrameHeader(buffer, headerOffset);

  if (!header) {
    return 180;
  }

  const xingDuration = getXingDuration(buffer, headerOffset, header);

  if (xingDuration) {
    return Math.max(1, Math.round(xingDuration));
  }

  const audioBytes = Math.max(1, buffer.length - headerOffset);
  return Math.max(1, Math.round((audioBytes * 8) / (header.bitrateKbps * 1000)));
}

function skipId3(buffer) {
  if (buffer.length < 10 || buffer.toString("utf8", 0, 3) !== "ID3") {
    return 0;
  }

  return 10 + syncSafeToInt(buffer[6], buffer[7], buffer[8], buffer[9]);
}

function syncSafeToInt(a, b, c, d) {
  return (a << 21) | (b << 14) | (c << 7) | d;
}

function findFrameHeader(buffer, offset) {
  for (let index = offset; index < buffer.length - 4; index += 1) {
    if (buffer[index] === 0xff && (buffer[index + 1] & 0xe0) === 0xe0) {
      return index;
    }
  }

  return -1;
}

function parseFrameHeader(buffer, offset) {
  const b1 = buffer[offset + 1];
  const b2 = buffer[offset + 2];
  const b3 = buffer[offset + 3];
  const versionBits = (b1 >> 3) & 0x03;
  const layerBits = (b1 >> 1) & 0x03;
  const bitrateIndex = (b2 >> 4) & 0x0f;
  const sampleRateIndex = (b2 >> 2) & 0x03;
  const channelMode = (b3 >> 6) & 0x03;

  if (versionBits === 1 || layerBits === 0 || bitrateIndex === 0 || bitrateIndex === 15 || sampleRateIndex === 3) {
    return null;
  }

  const version = versionBits === 3 ? 1 : 2;
  const layer = 4 - layerBits;
  const sampleRateColumn = versionBits === 3 ? 0 : versionBits === 2 ? 1 : 2;
  const bitrateKey = `${version}:${layer}`;
  const bitrateKbps = bitrateTable[bitrateKey]?.[bitrateIndex];
  const sampleRate = sampleRates[sampleRateIndex]?.[sampleRateColumn];

  if (!bitrateKbps || !sampleRate) {
    return null;
  }

  return {
    bitrateKbps,
    channelMode,
    layer,
    sampleRate,
    samplesPerFrame: layer === 1 ? 384 : version === 1 ? 1152 : 576,
    version
  };
}

function getXingDuration(buffer, headerOffset, header) {
  const sideInfoSize = header.version === 1
    ? header.channelMode === 3 ? 17 : 32
    : header.channelMode === 3 ? 9 : 17;
  const xingOffset = headerOffset + 4 + sideInfoSize;
  const marker = buffer.toString("ascii", xingOffset, xingOffset + 4);

  if (marker !== "Xing" && marker !== "Info") {
    return null;
  }

  const flags = buffer.readUInt32BE(xingOffset + 4);

  if ((flags & 0x0001) !== 0x0001) {
    return null;
  }

  const frames = buffer.readUInt32BE(xingOffset + 8);
  return (frames * header.samplesPerFrame) / header.sampleRate;
}
