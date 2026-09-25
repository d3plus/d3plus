import assert from "assert";
import http from "node:http";
import {Agent, fetch as undiciFetch} from "undici";
import {Geomap} from "@d3plus/core";
import {createCanvas} from "@napi-rs/canvas";
import {renderToStaticSVG} from "../es/index.js";
import {createTileLookup, fetchTileFollowingRedirects, isBlockedAddress, isSafeTileUrl} from "../es/src/geomapTiles.js";

const cities = [
  {city: "NYC", coords: [-74, 40.7]},
  {city: "London", coords: [-0.1, 51.5]},
];
const geomap = () =>
  new Geomap().data(cities).point(d => d.coords).groupBy("city");

/** A deterministic tile so tests need no network. */
function mockTile() {
  const c = createCanvas(256, 256);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#cde";
  ctx.fillRect(0, 0, 256, 256);
  return c.toBuffer("image/png");
}

const blockedTileUrls = [
  "http://127.0.0.1/{z}/{x}/{y}.png",
  "http://localhost/{z}/{x}/{y}.png",
  "http://10.0.0.1/{z}/{x}/{y}.png",
  "http://172.16.0.1/{z}/{x}/{y}.png",
  "http://192.168.1.1/{z}/{x}/{y}.png",
  "http://169.254.169.254/latest/meta-data/",
  "http://[::1]/{z}/{x}/{y}.png",
  "http://[::ffff:127.0.0.1]/{z}/{x}/{y}.png",
  "http://2130706433/{z}/{x}/{y}.png", // decimal for 127.0.0.1
  "http://0x7f000001/{z}/{x}/{y}.png", // hex for 127.0.0.1
  "file:///etc/passwd",
  "not a url",
];
for (const url of blockedTileUrls) {
  it(`isSafeTileUrl rejects ${url}`, () => {
    assert.strictEqual(isSafeTileUrl(url), false);
  });
}

it("isSafeTileUrl allows a normal public hostname (validated later, at DNS-resolution time)", () => {
  assert.strictEqual(isSafeTileUrl("https://tile.openstreetmap.org/{z}/{x}/{y}.png"), true);
});

const blockedAddresses = [
  "127.0.0.1",
  "169.254.169.254",
  "10.0.0.1",
  "::1",
  "::ffff:127.0.0.1",
  "::ffff:7f00:1",
  "64:ff9b::a00:1", // NAT64 -> 10.0.0.1
  "2002:7f00:1::", // 6to4 -> 127.0.0.1
  "::7f00:1", // IPv4-compatible (deprecated) -> 127.0.0.1
];
for (const address of blockedAddresses) {
  it(`isBlockedAddress blocks ${address}`, () => assert.strictEqual(isBlockedAddress(address), true));
}

const allowedAddresses = ["8.8.8.8", "1.1.1.1", "2001:4860:4860::8888"];
for (const address of allowedAddresses) {
  it(`isBlockedAddress allows ${address}`, () => assert.strictEqual(isBlockedAddress(address), false));
}

it("createTileLookup blocks a hostname that resolves to a disallowed address (DNS rebinding)", done => {
  const fakeResolve = (hostname, options, callback) => {
    callback(null, [{address: "169.254.169.254", family: 4}]);
  };
  const lookup = createTileLookup(fakeResolve);
  lookup("attacker.example", {}, err => {
    assert.ok(err instanceof Error, "expected the lookup to error");
    assert.ok(/disallowed address/.test(err.message));
    done();
  });
});

it("createTileLookup allows a hostname that resolves to a public address", done => {
  const fakeResolve = (hostname, options, callback) => {
    callback(null, [{address: "93.184.216.34", family: 4}]);
  };
  const lookup = createTileLookup(fakeResolve);
  lookup("tile.example", {}, (err, address) => {
    assert.strictEqual(err, null);
    assert.strictEqual(address, "93.184.216.34");
    done();
  });
});

it("createTileLookup blocks when only one of several resolved addresses is disallowed", done => {
  const fakeResolve = (hostname, options, callback) => {
    callback(null, [
      {address: "93.184.216.34", family: 4},
      {address: "169.254.169.254", family: 4},
    ]);
  };
  const lookup = createTileLookup(fakeResolve);
  lookup("attacker.example", {}, err => {
    assert.ok(err instanceof Error, "expected the lookup to error");
    done();
  });
});

it("fetchTileFollowingRedirects follows an http-to-https style redirect", async () => {
  const calls = [];
  const doFetch = async current => {
    calls.push(current);
    if (calls.length === 1) {
      return {
        status: 301,
        ok: false,
        headers: {get: name => (name === "location" ? "https://tile.example/0/0/0.png" : null)},
      };
    }
    return {
      status: 200,
      ok: true,
      headers: {get: () => "image/png"},
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  };
  const res = await fetchTileFollowingRedirects("http://tile.example/0/0/0.png", undefined, doFetch);
  assert.deepStrictEqual(calls, ["http://tile.example/0/0/0.png", "https://tile.example/0/0/0.png"]);
  assert.ok(res && res.ok, "the final response is returned");
});

it("fetchTileFollowingRedirects refuses to follow a redirect to an unsafe target", async () => {
  let calls = 0;
  const doFetch = async () => {
    calls++;
    return {
      status: 302,
      ok: false,
      headers: {get: name => (name === "location" ? "http://127.0.0.1/internal" : null)},
    };
  };
  const res = await fetchTileFollowingRedirects("https://tile.example/0/0/0.png", undefined, doFetch);
  assert.strictEqual(res, null, "the unsafe redirect target was rejected");
  assert.strictEqual(calls, 1, "the redirect target was never fetched");
});

it("fetchTileFollowingRedirects gives up after too many redirects", async () => {
  let calls = 0;
  const doFetch = async () => {
    calls++;
    return {
      status: 302,
      ok: false,
      headers: {get: name => (name === "location" ? "https://tile.example/next" : null)},
    };
  };
  const res = await fetchTileFollowingRedirects("https://tile.example/start", undefined, doFetch);
  assert.strictEqual(res, null, "the redirect loop was abandoned");
  assert.strictEqual(calls, 6, "expected exactly MAX_TILE_REDIRECTS + 1 fetch attempts");
});

// A real public host that redirects to an internal address can't be tested
// against a live local server: any server this test controls is itself on a
// loopback/private address, which isSafeTileUrl/createTileLookup would (by
// design) already refuse to connect to for the *initial* request — before a
// redirect ever enters the picture. This isolates the specific mechanism
// fetchOne's built-in fetch relies on for redirect safety (undici's
// `redirect: "manual"`, with the exact same dispatcher construction) against
// a local server that issues a 302 to an "internal" endpoint, proving that
// mechanism actually stops the follow-through rather than assuming it does.
it("undici fetch with redirect: \"manual\" never follows a redirect to an internal endpoint", async () => {
  let internalRequested = false;
  const server = http.createServer((req, res) => {
    if (req.url === "/internal") {
      internalRequested = true;
      res.writeHead(200, {"content-type": "image/png"});
      res.end(mockTile());
      return;
    }
    res.writeHead(302, {location: "/internal"});
    res.end();
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  const dispatcher = new Agent({connect: {lookup: createTileLookup()}});

  try {
    const res = await undiciFetch(`http://127.0.0.1:${port}/tile.png`, {
      redirect: "manual",
      dispatcher,
    });
    assert.strictEqual(internalRequested, false, "the redirect target was never requested");
    assert.strictEqual(res.ok, false, "a manual redirect response is not ok");
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});

it("Geomap built-in tile fetch refuses a private tileUrl with no fetchTile escape hatch", async () => {
  const svg = await renderToStaticSVG(
    geomap().tileUrl("http://169.254.169.254/latest/meta-data/"),
    {width: 640, height: 400},
  );
  assert.strictEqual((svg.match(/<image/g) || []).length, 0, "no tile images");
  assert.ok(!svg.includes("data:image"), "no tile inlined");
});

it("fetchTile still bypasses SSRF filtering for a private tileUrl (the documented escape hatch)", async () => {
  let calls = 0;
  let receivedUrl;
  const svg = await renderToStaticSVG(
    geomap().tileUrl("http://10.0.0.1/{z}/{x}/{y}.png"),
    {
      width: 640,
      height: 400,
      fetchTile: async url => {
        calls++;
        receivedUrl = url;
        return mockTile();
      },
    },
  );
  assert.ok(calls > 0, "fetchTile was called despite the private host");
  assert.ok(receivedUrl.startsWith("http://10.0.0.1/"), "fetchTile received the raw private URL");
  assert.ok(svg.includes('href="data:image'), "the tile was inlined");
});
