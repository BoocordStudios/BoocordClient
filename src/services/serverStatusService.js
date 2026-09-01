const dns = require("node:dns/promises");
const net = require("node:net");

const DEFAULT_HOST = "boocord.com";
const DEFAULT_PORT = 25565;
const DEFAULT_TIMEOUT_MS = 5000;
const STATUS_PROTOCOL_VERSION = 767;

function encodeVarInt(value) {
  const output = [];
  let remaining = value >>> 0;

  do {
    let byte = remaining & 0x7f;
    remaining >>>= 7;

    if (remaining !== 0) {
      byte |= 0x80;
    }

    output.push(byte);
  } while (remaining !== 0);

  return Buffer.from(output);
}

function decodeVarInt(buffer, offset = 0) {
  let result = 0;
  let shift = 0;
  let cursor = offset;

  while (cursor < buffer.length) {
    const byte = buffer[cursor];
    result |= (byte & 0x7f) << shift;
    cursor += 1;

    if ((byte & 0x80) !== 0x80) {
      return {
        value: result,
        size: cursor - offset
      };
    }

    shift += 7;

    if (shift > 35) {
      throw new Error("VarInt ist zu groß.");
    }
  }

  const error = new Error("Unvollständiges Paket.");
  error.code = "INCOMPLETE_PACKET";
  throw error;
}

function encodeString(value) {
  const payload = Buffer.from(String(value), "utf8");
  return Buffer.concat([encodeVarInt(payload.length), payload]);
}

function encodeUnsignedShort(value) {
  const payload = Buffer.alloc(2);
  payload.writeUInt16BE(value, 0);
  return payload;
}

function wrapPacket(payload) {
  return Buffer.concat([encodeVarInt(payload.length), payload]);
}

function flattenDescription(value) {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => flattenDescription(entry)).join("");
  }

  if (typeof value === "object") {
    return [value.text, ...(value.extra || []).map((entry) => flattenDescription(entry))]
      .filter(Boolean)
      .join("");
  }

  return "";
}

async function resolveEndpoint(host, port) {
  try {
    const records = await dns.resolveSrv(`_minecraft._tcp.${host}`);

    if (!records.length) {
      return { host, port };
    }

    const [selected] = [...records].sort((left, right) => {
      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return right.weight - left.weight;
    });

    return {
      host: selected.name,
      port: selected.port
    };
  } catch {
    return { host, port };
  }
}

async function getMinecraftServerStatus({
  host = DEFAULT_HOST,
  port = DEFAULT_PORT,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  const endpoint = await resolveEndpoint(host, port);

  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;
    let responseBuffer = Buffer.alloc(0);
    let requestStartedAt = 0;

    const finish = (payload) => {
      if (settled) {
        return;
      }

      settled = true;
      socket.destroy();
      resolve({
        host,
        port: endpoint.port,
        resolvedHost: endpoint.host,
        checkedAt: new Date().toISOString(),
        ...payload
      });
    };

    const timeout = setTimeout(() => {
      finish({
        online: false,
        error: "Zeitüberschreitung beim Serverstatus."
      });
    }, timeoutMs);

    socket.once("error", (error) => {
      clearTimeout(timeout);
      finish({
        online: false,
        error: error.message
      });
    });

    socket.on("data", (chunk) => {
      responseBuffer = Buffer.concat([responseBuffer, chunk]);

      try {
        const packetLength = decodeVarInt(responseBuffer, 0);

        if (responseBuffer.length < packetLength.size + packetLength.value) {
          return;
        }

        let offset = packetLength.size;
        const packetId = decodeVarInt(responseBuffer, offset);
        offset += packetId.size;

        if (packetId.value !== 0) {
          clearTimeout(timeout);
          finish({
            online: false,
            error: `Unerwartetes Antwortpaket: ${packetId.value}`
          });
          return;
        }

        const jsonLength = decodeVarInt(responseBuffer, offset);
        offset += jsonLength.size;
        const jsonPayload = responseBuffer.slice(offset, offset + jsonLength.value).toString("utf8");
        const parsed = JSON.parse(jsonPayload);

        clearTimeout(timeout);
        finish({
          online: true,
          latencyMs: Math.max(1, Date.now() - requestStartedAt),
          version: parsed.version?.name || null,
          protocol: parsed.version?.protocol || null,
          motd: flattenDescription(parsed.description) || "Keine Beschreibung.",
          playersOnline: parsed.players?.online ?? null,
          playersMax: parsed.players?.max ?? null,
          samplePlayers: (parsed.players?.sample || []).map((entry) => entry.name).slice(0, 8),
          favicon: parsed.favicon || null
        });
      } catch (error) {
        if (error.code === "INCOMPLETE_PACKET") {
          return;
        }

        clearTimeout(timeout);
        finish({
          online: false,
          error: error.message
        });
      }
    });

    socket.connect(endpoint.port, endpoint.host, () => {
      requestStartedAt = Date.now();

      const handshakePayload = Buffer.concat([
        encodeVarInt(0),
        encodeVarInt(STATUS_PROTOCOL_VERSION),
        encodeString(host),
        encodeUnsignedShort(endpoint.port),
        encodeVarInt(1)
      ]);

      const requestPayload = encodeVarInt(0);
      socket.write(Buffer.concat([wrapPacket(handshakePayload), wrapPacket(requestPayload)]));
    });
  });
}

module.exports = {
  getMinecraftServerStatus
};
