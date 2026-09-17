import { describe, it, expect } from "vitest";
import { responsivePath } from "../../src/workers/responsive-images";
import manifest from "../../src/workers/responsive-manifest.json";
describe("Workers pre-generated images", () => {
  it("maps known local sources to a suitably sized content-hashed asset", () => {
    const source = "/visuals/kissa-ritual-v2.webp";
    const result = responsivePath(
      new URL(
        "https://preview.test/_next/image?url=" +
          encodeURIComponent(source) +
          "&w=750&q=75",
      ),
    );
    expect(result).toMatch(/^\/_responsive\/[a-f0-9]{20}-750\.webp$/);
    expect(
      manifest[source].variants.find((v) => v.width === 750)!.bytes,
    ).toBeLessThan(manifest[source].originalBytes);
  });
  it("does not transform remote URLs, traversal, unknown keys or invalid widths", () => {
    for (const source of [
      "https://evil.test/a.png",
      "/../private.png",
      "__proto__",
      "/not-present.png",
    ])
      expect(
        responsivePath(
          new URL(
            "https://preview.test/_next/image?url=" +
              encodeURIComponent(source) +
              "&w=750&q=75",
          ),
        ),
      ).toBeNull();
    for (const w of ["0", "9999", "NaN", "20.5"])
      expect(
        responsivePath(
          new URL(
            "https://preview.test/_next/image?url=%2Fvisuals%2Fkissa-ritual-v2.webp&w=" +
              w,
          ),
        ),
      ).toBeNull();
  });
  it("does not upscale beyond a source size or intercept unrelated routes", () => {
    const source = "/visuals/kissa-ritual-v2.webp",
      largest = manifest[source].variants.at(-1)!;
    expect(
      responsivePath(
        new URL(
          "https://preview.test/_next/image?url=" +
            encodeURIComponent(source) +
            "&w=3840",
        ),
      ),
    ).toBe(largest.path);
    expect(responsivePath(new URL("https://preview.test/contact"))).toBeNull();
  });
});
