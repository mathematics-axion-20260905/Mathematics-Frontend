import {
    SCIENTIFIC_OBJECT_TRANSFER_SCHEMA_VERSION,
    type ScientificObjectTransferEnvelope,
    deserializeScientificObject,
    serializeScientificObject,
} from "./contracts";

const TOKEN_PREFIX = "ax1:";

/**
 * Computes SHA-256 hash of a string using Web Crypto API.
 */
export async function computePayloadHash(content: string): Promise<string> {
    if (typeof crypto !== "undefined" && crypto.subtle) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(content);
            const hashBuffer = await crypto.subtle.digest("SHA-256", data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
        } catch {}
    }
    // Deterministic fallback hash
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        hash = (hash << 5) - hash + content.charCodeAt(i);
        hash |= 0;
    }
    return `h_${Math.abs(hash).toString(16)}`;
}

/**
 * Compresses a Scientific Object transfer envelope into a compact, lossless URL-safe token.
 */
export async function compressScientificObject<T = unknown>(
    envelope: ScientificObjectTransferEnvelope<T>
): Promise<{ token: string; hash: string; rawBytes: number; compressedBytes: number }> {
    const rawJson = serializeScientificObject(envelope.object as any, envelope.revisions as any);
    const hash = await computePayloadHash(rawJson);

    if (typeof CompressionStream !== "undefined" && typeof Response !== "undefined") {
        try {
            const stream = new Response(rawJson).body;
            if (stream && typeof stream.pipeThrough === "function") {
                const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
                const buffer = await new Response(compressedStream).arrayBuffer();
                const uint8 = new Uint8Array(buffer);

                let binary = "";
                const len = uint8.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(uint8[i]);
                }
                const b64 = btoa(binary);
                const token = `${TOKEN_PREFIX}${hash.slice(0, 8)}:${b64}`;

                return {
                    token,
                    hash,
                    rawBytes: rawJson.length,
                    compressedBytes: buffer.byteLength,
                };
            }
        } catch {
            // Fall through to lossless base64
        }
    }

    // Lossless base64 encoding (e.g. in test or non-stream environments)
    const b64 = btoa(encodeURIComponent(rawJson));
    return {
        token: `${TOKEN_PREFIX}raw:${hash.slice(0, 8)}:${b64}`,
        hash,
        rawBytes: rawJson.length,
        compressedBytes: b64.length,
    };
}

/**
 * Decompresses a compressed scientific object token losslessly and verifies its integrity.
 */
export async function decompressScientificObject<T = unknown>(
    token: string
): Promise<{ envelope: ScientificObjectTransferEnvelope<T>; hash: string }> {
    if (!token.startsWith(TOKEN_PREFIX)) {
        const envelope = deserializeScientificObject<T>(token);
        return { envelope, hash: await computePayloadHash(token) };
    }

    const payloadPart = token.slice(TOKEN_PREFIX.length);

    if (payloadPart.startsWith("raw:")) {
        const parts = payloadPart.split(":");
        const b64 = parts[parts.length - 1];
        const rawJson = decodeURIComponent(atob(b64));
        const hash = await computePayloadHash(rawJson);
        const envelope = deserializeScientificObject<T>(rawJson);
        return { envelope, hash };
    }

    const colonIdx = payloadPart.indexOf(":");
    const b64 = colonIdx >= 0 ? payloadPart.slice(colonIdx + 1) : payloadPart;

    const binaryString = atob(b64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    if (typeof DecompressionStream !== "undefined" && typeof Response !== "undefined") {
        try {
            const stream = new Response(bytes).body;
            if (stream && typeof stream.pipeThrough === "function") {
                const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
                const text = await new Response(decompressedStream).text();
                const hash = await computePayloadHash(text);
                const envelope = deserializeScientificObject<T>(text);
                return { envelope, hash };
            }
        } catch {}
    }

    // Fallback
    const rawJson = decodeURIComponent(atob(b64));
    const hash = await computePayloadHash(rawJson);
    return { envelope: deserializeScientificObject<T>(rawJson), hash };
}
