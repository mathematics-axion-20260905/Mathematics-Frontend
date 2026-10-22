import { describe, expect, it } from "vitest";

import {
  deserializeScientificObject,
  serializeScientificObject,
  type ScientificObject,
} from "./contracts";

describe("Scientific Object transfer envelope", () => {
  it("round-trips the object identity, payload, provenance, and revisions", () => {
    const object: ScientificObject<{ points: number[] }> = {
      id: "object-1",
      projectId: "project-1",
      kind: "simulation",
      schemaVersion: "1.0",
      title: "Heat simulation",
      sourceApp: "math",
      currentRevision: 2,
      revision: {
        objectId: "object-1",
        revision: 2,
        payload: { points: [0, 1, 4] },
        provenance: { sourceApp: "math", executionTarget: "this-device" },
      },
    };

    const serialized = serializeScientificObject(object, [
      { ...object.revision!, revision: 1 },
      object.revision!,
    ]);
    const envelope = deserializeScientificObject<{ points: number[] }>(serialized);

    expect(envelope.object.id).toBe("object-1");
    expect(envelope.object.currentRevision).toBe(2);
    expect(envelope.revisions).toHaveLength(2);
    expect(envelope.revisions[1].payload.points).toEqual([0, 1, 4]);
    expect(envelope.revisions[1].provenance.executionTarget).toBe("this-device");
  });

  it("rejects malformed or incompatible envelopes", () => {
    expect(() => deserializeScientificObject('{"transferSchemaVersion":"0.1"}')).toThrow("INVALID_SCIENTIFIC_OBJECT_TRANSFER_ENVELOPE");
  });

  it("rejects an envelope that silently drops an earlier revision", () => {
    const incomplete = {
      transferSchemaVersion: "1.0",
      exportedAt: new Date().toISOString(),
      object: {
        id: "object-1",
        projectId: "project-1",
        kind: "calculation",
        schemaVersion: "1.0",
        title: "Integral result",
        sourceApp: "math",
        currentRevision: 2,
      },
      revisions: [{
        objectId: "object-1",
        revision: 2,
        payload: { value: 42 },
        provenance: { sourceApp: "math" },
      }],
    };

    expect(() => deserializeScientificObject(JSON.stringify(incomplete))).toThrow("INVALID_SCIENTIFIC_OBJECT_TRANSFER_REVISIONS");
  });

  it("losslessly compresses and decompresses scientific object transfer token", async () => {
    const { compressScientificObject, decompressScientificObject } = await import("./compressed-object");
    const object: ScientificObject<{ matrix: number[][]; tensor: number[] }> = {
      id: "sciobj-compress-1",
      projectId: "proj-1",
      kind: "calculation",
      schemaVersion: "1.0",
      title: "High precision experiment",
      sourceApp: "math",
      currentRevision: 1,
      revision: {
        objectId: "sciobj-compress-1",
        revision: 1,
        payload: {
          matrix: [[1.23456789012345, 9.87654321098765], [0.0000000001, -3.14159265358979]],
          tensor: [0.1, 0.2, 0.3, 0.4, 0.5],
        },
        provenance: { sourceApp: "math", executionTarget: "this-device", engine: "Axion CAS" },
      },
    };

    const envelope = deserializeScientificObject(serializeScientificObject(object));
    const { token, hash } = await compressScientificObject(envelope);

    expect(token).toBeDefined();
    expect(token.length).toBeGreaterThan(0);

    const result = await decompressScientificObject(token);
    expect(result.hash).toBe(hash);
    expect(result.envelope.object.id).toBe("sciobj-compress-1");
    expect(result.envelope.revisions[0].payload).toEqual(envelope.revisions[0].payload);
  });
});
