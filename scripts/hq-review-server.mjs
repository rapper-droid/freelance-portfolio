import http from "node:http";
import fs from "node:fs";
import path from "node:path";
// A read-only local evidence viewer. It cannot browse arbitrary workspace files.
const root = path.resolve("../../outputs/master-hq");
const port = Number(process.env.HQ_REVIEW_PORT || 3162);
const types = {
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".webm": "video/webm",
  ".md": "text/plain; charset=utf-8",
};
http
  .createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://127.0.0.1").pathname,
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    if (pathname === "/") pathname = "/OWNER_REVIEW.html";
    if (
      !/^\/(OWNER_REVIEW\.html|RESULTS\.md|(before|after|motion)\/[a-zA-Z0-9-]+\.(png|webm))$/.test(
        pathname,
      )
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    const file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.stat(file, (error, stat) => {
      if (error || !stat.isFile()) {
        res.writeHead(404);
        res.end();
        return;
      }
      const headers = {
        "Content-Type": types[path.extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Robots-Tag": "noindex, nofollow",
        "Content-Length": stat.size,
        "Accept-Ranges": "bytes",
      };
      let start = 0,
        end = stat.size - 1,
        status = 200;
      if (req.headers.range) {
        const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
        if (!match) {
          res.writeHead(416);
          res.end();
          return;
        }
        start = Number(match[1]);
        end = match[2] ? Number(match[2]) : end;
        if (start > end || end >= stat.size) {
          res.writeHead(416);
          res.end();
          return;
        }
        status = 206;
        headers["Content-Range"] =
          "bytes " + start + "-" + end + "/" + stat.size;
        headers["Content-Length"] = end - start + 1;
      }
      res.writeHead(status, headers);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      const stream = fs.createReadStream(file, { start, end });
      stream.on("error", () => res.destroy());
      stream.pipe(res);
    });
  })
  .listen(port, "127.0.0.1", () =>
    console.log("OWNER REVIEW http://127.0.0.1:" + port + "/OWNER_REVIEW.html"),
  );
