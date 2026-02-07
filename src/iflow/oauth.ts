import * as http from "http";
import { URL } from "url";
import { IFLOW_CONSTANTS } from "../constants.js";

/**
 * Starts the local OAuth callback server and returns:
 * - url: the iFlow auth URL to open in the browser
 * - callback: a function that returns a promise resolving with the API key
 *
 * Flow:
 * 1. Start local HTTP server on fixed port 11451
 * 2. Return auth URL for OpenCode to open in browser
 * 3. callback() waits for the code, exchanges it, fetches user info
 * 4. Returns { type: "success", key: apiKey } or { type: "failed" }
 */
export function startOAuthFlow(): {
  url: string;
  callback: () => Promise<
    { type: "success"; key: string } | { type: "failed" }
  >;
} {
  const port = IFLOW_CONSTANTS.CALLBACK_PORT;
  const redirectUri = `http://localhost:${port}${IFLOW_CONSTANTS.CALLBACK_PATH}`;
  const state = Math.random().toString(36).substring(2, 15);

  // Build auth URL
  const authUrl = new URL(IFLOW_CONSTANTS.AUTH_ENDPOINT);
  authUrl.searchParams.set("client_id", IFLOW_CONSTANTS.CLIENT_ID);
  authUrl.searchParams.set("redirect", redirectUri);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("loginMethod", "phone");
  authUrl.searchParams.set("type", "phone");

  // Create a promise that resolves when the callback server receives the code
  let resolveCode: (code: string) => void;
  let rejectCode: (err: Error) => void;
  const codePromise = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  // Start local HTTP server
  const server = http.createServer((req, res) => {
    try {
      if (!req.url) return;
      const url = new URL(req.url, `http://localhost:${port}`);

      if (url.pathname !== IFLOW_CONSTANTS.CALLBACK_PATH) {
        res.writeHead(404);
        res.end();
        return;
      }

      const error = url.searchParams.get("error");
      if (error) {
        res.writeHead(302, { Location: IFLOW_CONSTANTS.ERROR_REDIRECT_URL });
        res.end();
        server.close();
        rejectCode(new Error(`Auth failed: ${error}`));
        return;
      }

      const code = url.searchParams.get("code");
      if (!code) {
        res.writeHead(302, { Location: IFLOW_CONSTANTS.ERROR_REDIRECT_URL });
        res.end();
        server.close();
        rejectCode(new Error("Missing authorization code"));
        return;
      }

      // Redirect browser to iFlow success page
      res.writeHead(302, { Location: IFLOW_CONSTANTS.SUCCESS_REDIRECT_URL });
      res.end();
      server.close();
      resolveCode(code);
    } catch (e) {
      console.error(e);
      res.writeHead(500);
      res.end("Internal Server Error");
    }
  });

  server.listen(port, "127.0.0.1");

  server.on("error", (err) => {
    rejectCode(new Error(`OAuth server error: ${err.message}`));
  });

  // 5 minute timeout
  const timeout = setTimeout(() => {
    server.close();
    rejectCode(new Error("OAuth timeout - no callback received within 5 minutes"));
  }, 5 * 60 * 1000);

  return {
    url: authUrl.toString(),
    callback: async () => {
      try {
        const code = await codePromise;
        clearTimeout(timeout);

        // Exchange code for token
        const tokenData = await exchangeCodeForToken(code, redirectUri);

        // Fetch user info to get API key
        const userInfo = await fetchUserInfo(tokenData.access_token);

        return { type: "success" as const, key: userInfo.apiKey };
      } catch {
        clearTimeout(timeout);
        return { type: "failed" as const };
      }
    },
  };
}

async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  // Basic auth header: base64(client_id:client_secret)
  const basicAuth = Buffer.from(
    `${IFLOW_CONSTANTS.CLIENT_ID}:${IFLOW_CONSTANTS.CLIENT_SECRET}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: IFLOW_CONSTANTS.CLIENT_ID,
    client_secret: IFLOW_CONSTANTS.CLIENT_SECRET,
  });

  const response = await fetch(IFLOW_CONSTANTS.TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as any;
  if (!data.access_token) {
    throw new Error("Token exchange returned empty access_token");
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || "",
    expires_in: data.expires_in || 3600,
  };
}

async function fetchUserInfo(
  accessToken: string
): Promise<{ apiKey: string; email: string; phone: string }> {
  const url = `${IFLOW_CONSTANTS.USER_INFO_ENDPOINT}?accessToken=${encodeURIComponent(accessToken)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`User info request failed (${response.status}): ${text}`);
  }

  const result = (await response.json()) as any;
  if (!result.success) {
    throw new Error("User info request was not successful");
  }

  if (!result.data?.apiKey) {
    throw new Error("User info response missing API key");
  }

  return {
    apiKey: result.data.apiKey,
    email: result.data.email || "",
    phone: result.data.phone || "",
  };
}
