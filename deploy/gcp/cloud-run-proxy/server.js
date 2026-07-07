const http = require("http");

const VM_HOST = process.env.VM_HOST || "35.207.219.20";
const VM_PORT = Number(process.env.VM_PORT || "80");
const PORT = Number(process.env.PORT || "8080");

const server = http.createServer((req, res) => {
  const headers = { ...req.headers };
  delete headers.host;
  headers.host = VM_HOST;

  const proxyReq = http.request(
    {
      hostname: VM_HOST,
      port: VM_PORT,
      path: req.url,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on("error", (error) => {
    console.error("Proxy error:", error);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Backend unavailable",
          detail: error.message,
        }),
      );
    }
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(PORT, () => {
  console.log(`Proxy listening on ${PORT} -> http://${VM_HOST}:${VM_PORT}`);
});
