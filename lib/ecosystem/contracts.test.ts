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
});
