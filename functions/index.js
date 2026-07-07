const { onRequest } = require("firebase-functions/v2/https");
const http = require("http");

const VM_HOST = process.env.VM_HOST || "35.207.219.20";
const VM_PORT = Number(process.env.VM_PORT || "80");

/**
 * Proxy API traffic from Firebase Hosting (HTTPS) to the GCP VM (HTTP).
 * Avoids browser mixed-content blocks for https://jankendra-ai.web.app.
 */
exports.vmProxy = onRequest(
  {
    region: "asia-south1",
    timeoutSeconds: 120,
    memory: "256MiB",
    invoker: "public",
  },
  (req, res) => {
    const path = req.originalUrl || req.url || "/";
    const headers = { ...req.headers };
    delete headers.host;
    headers.host = VM_HOST;

    const proxyReq = http.request(
      {
        hostname: VM_HOST,
        port: VM_PORT,
        path,
        method: req.method,
        headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      },
    );

    proxyReq.on("error", (error) => {
      console.error("VM proxy error:", error);
      if (!res.headersSent) {
        res.status(502).json({
          error: "Backend unavailable",
          detail: error.message,
          vm: VM_HOST,
        });
      }
    });

    req.pipe(proxyReq, { end: true });
  },
);
