import {it} from "vitest";
import assert from "assert";
import http from "node:http";
import {Geomap} from "@d3plus/core";
import {createCanvas} from "@napi-rs/canvas";
import {renderToStaticSVG} from "../index.ts";
import {
  createTileLookup,
  defaultTileFetch,
  fetchTileFollowingRedirects,
  isBlockedAddress,
  isSafeTileUrl,
} from "../src/geomapTiles.ts";

const cities = [
  {city: "NYC", coords: [-74, 40.7]},
  {city: "London", coords: [-0.1, 51.5]},
];
const geomap = () =>
  new Geomap()
    .data(cities)
    .point(d => d.coords)
    .groupBy("city");

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
  assert.strictEqual(
    isSafeTileUrl("https://tile.openstreetmap.org/{z}/{x}/{y}.png"),
    true,
  );
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
  it(`isBlockedAddress blocks ${address}`, () =>
    assert.strictEqual(isBlockedAddress(address), true));
}

const allowedAddresses = ["8.8.8.8", "1.1.1.1", "2001:4860:4860::8888"];
for (const address of allowedAddresses) {
  it(`isBlockedAddress allows ${address}`, () =>
    assert.strictEqual(isBlockedAddress(address), false));
}

it("createTileLookup blocks a hostname that resolves to a disallowed address (DNS rebinding)", () =>
  new Promise(done => {
    const fakeResolve = (hostname, options, callback) => {
      callback(null, [{address: "169.254.169.254", family: 4}]);
    };
    const lookup = createTileLookup(fakeResolve);
    lookup("attacker.example", {}, err => {
      assert.ok(err instanceof Error, "expected the lookup to error");
      assert.ok(/disallowed address/.test(err.message));
      done();
    });
  }));

it("createTileLookup allows a hostname that resolves to a public address", () =>
  new Promise(done => {
    const fakeResolve = (hostname, options, callback) => {
      callback(null, [{address: "93.184.216.34", family: 4}]);
    };
    const lookup = createTileLookup(fakeResolve);
    lookup("tile.example", {}, (err, address) => {
      assert.strictEqual(err, null);
      assert.strictEqual(address, "93.184.216.34");
      done();
    });
  }));

it("createTileLookup blocks when only one of several resolved addresses is disallowed", () =>
  new Promise(done => {
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
  }));

it("fetchTileFollowingRedirects follows an http-to-https style redirect and releases the redirect's body", async () => {
  const calls = [];
  let redirectCancelled = false;
  const doFetch = async current => {
    calls.push(current);
    if (calls.length === 1) {
      return {
        status: 301,
        ok: false,
        headers: {
          get: name =>
            name === "location" ? "https://tile.example/0/0/0.png" : null,
        },
        body: {
          cancel: async () => {
            redirectCancelled = true;
          },
        },
      };
    }
    return {
      status: 200,
      ok: true,
      headers: {get: () => "image/png"},
      arrayBuffer: async () => new ArrayBuffer(0),
    };
  };
  const res = await fetchTileFollowingRedirects(
    "http://tile.example/0/0/0.png",
    undefined,
    doFetch,
  );
  assert.deepStrictEqual(calls, [
    "http://tile.example/0/0/0.png",
    "https://tile.example/0/0/0.png",
  ]);
  assert.ok(res && res.ok, "the final response is returned");
  assert.strictEqual(
    redirectCancelled,
    true,
    "the redirect response's body was released",
  );
});

it("fetchTileFollowingRedirects releases the body even without a body.cancel mock (optional chaining)", async () => {
  const doFetch = async () => ({
    status: 301,
    ok: false,
    headers: {
      get: name =>
        name === "location" ? "https://tile.example/next.png" : null,
    },
  });
  // Should not throw even though these fake responses have no `body` at all.
  const res = await fetchTileFollowingRedirects(
    "https://tile.example/0/0/0.png",
    undefined,
    doFetch,
  );
  assert.strictEqual(
    res,
    null,
    "the redirect loop was abandoned once the hop limit was hit",
  );
});

it("fetchTileFollowingRedirects refuses to follow a redirect to an unsafe target, releasing its body", async () => {
  let calls = 0;
  let cancelCalls = 0;
  const doFetch = async () => {
    calls++;
    return {
      status: 302,
      ok: false,
      headers: {
        get: name => (name === "location" ? "http://127.0.0.1/internal" : null),
      },
      body: {
        cancel: async () => {
          cancelCalls++;
        },
      },
    };
  };
  const res = await fetchTileFollowingRedirects(
    "https://tile.example/0/0/0.png",
    undefined,
    doFetch,
  );
  assert.strictEqual(res, null, "the unsafe redirect target was rejected");
  assert.strictEqual(calls, 1, "the redirect target was never fetched");
  assert.strictEqual(
    cancelCalls,
    1,
    "the redirect response's body was released before the target was rejected",
  );
});

it("fetchTileFollowingRedirects gives up after too many redirects, releasing every hop's body", async () => {
  let calls = 0;
  let cancelCalls = 0;
  const doFetch = async () => {
    calls++;
    return {
      status: 302,
      ok: false,
      headers: {
        get: name => (name === "location" ? "https://tile.example/next" : null),
      },
      body: {
        cancel: async () => {
          cancelCalls++;
        },
      },
    };
  };
  const res = await fetchTileFollowingRedirects(
    "https://tile.example/start",
    undefined,
    doFetch,
  );
  assert.strictEqual(res, null, "the redirect loop was abandoned");
  assert.strictEqual(
    calls,
    6,
    "expected exactly MAX_TILE_REDIRECTS + 1 fetch attempts",
  );
  assert.strictEqual(
    cancelCalls,
    6,
    "every redirect response's body was released",
  );
});

/** Serves a tile at /tile.png, a 302 to /internal anywhere else, and records each request path. */
async function tileServer(run) {
  const requested = [];
  const server = http.createServer((req, res) => {
    requested.push(req.url);
    if (req.url === "/tile.png" || req.url === "/internal") {
      res.writeHead(200, {"content-type": "image/png"});
      res.end(mockTile());
      return;
    }
    res.writeHead(302, {location: "/internal"});
    res.end();
  });
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  try {
    await run(server.address().port, requested);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

// A real public host that redirects to an internal address can't be tested
// against a live local server: any server this test controls is itself on a
// loopback address, which isSafeTileUrl refuses before any request. These call
// the built-in request directly to check what the redirect loop relies on: it
// returns a redirect instead of following it, and it resolves hostnames
// through createTileLookup.
it("defaultTileFetch returns a redirect without following it", () =>
  tileServer(async (port, requested) => {
    const res = await defaultTileFetch(`http://127.0.0.1:${port}/redirect`, {});
    assert.strictEqual(res.status, 302);
    assert.strictEqual(res.ok, false, "a redirect response is not ok");
    assert.strictEqual(res.headers.get("location"), "/internal");
    assert.deepStrictEqual(
      requested,
      ["/redirect"],
      "the redirect target was never requested",
    );
  }));

it("defaultTileFetch refuses a hostname that resolves to a disallowed address", () =>
  tileServer(async (port, requested) => {
    await assert.rejects(
      defaultTileFetch(`http://localhost:${port}/tile.png`, {}),
      /refusing to fetch a tile from "localhost"/,
    );
    assert.deepStrictEqual(requested, [], "no connection was made");
  }));

it("defaultTileFetch reads a response's status, headers, and bytes", () =>
  tileServer(async port => {
    const res = await defaultTileFetch(`http://127.0.0.1:${port}/tile.png`, {
      headers: {"User-Agent": "test"},
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get("content-type"), "image/png");
    assert.deepStrictEqual(
      new Uint8Array(await res.arrayBuffer()),
      new Uint8Array(mockTile()),
    );
  }));

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
  assert.ok(
    receivedUrl.startsWith("http://10.0.0.1/"),
    "fetchTile received the raw private URL",
  );
  assert.ok(svg.includes('href="data:image'), "the tile was inlined");
});
