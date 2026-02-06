import * as http from "http";
import open from "open";
import { URL } from "url";
import { IFLOW_CONSTANTS } from "../constants.js";

export interface IflowToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export async function authorizeIflow(): Promise<IflowToken> {
  return new Promise((resolve, reject) => {
    // 1. Start a local server to listen for the callback
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) return;
        const url = new URL(req.url, `http://${req.headers.host}`);

        // Only handle the callback path
        if (url.pathname !== "/oauth2callback") {
          res.writeHead(404);
          res.end();
          return;
        }

        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(`<h1>Authentication Failed</h1><p>${error}</p>`);
          server.close();
          reject(new Error(`Auth failed: ${error}`));
          return;
        }

        if (code) {
          // 2. Respond to the browser
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(
            "<h1>Authentication Successful</h1><p>You can close this window and return to the CLI.</p>",
          );
          server.close();

          // 3. Exchange code for token
          try {
            const token = await exchangeCodeForToken(code);
            resolve(token);
          } catch (err) {
            reject(err);
          }
        }
      } catch (e) {
        console.error(e);
        res.writeHead(500);
        res.end("Internal Server Error");
      }
    });

    // Listen on a random free port (or specific one if required)
    server.listen(0, "127.0.0.1", async () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Failed to get server address"));
        return;
      }

      const port = address.port;
      const redirectUri = `http://localhost:${port}/oauth2callback`;
      const state = Math.random().toString(36).substring(7); // Simple state for security

      // 4. Construct Auth URL
      const authUrl = new URL(IFLOW_CONSTANTS.AUTH_ENDPOINT);
      authUrl.searchParams.append("client_id", IFLOW_CONSTANTS.CLIENT_ID);
      authUrl.searchParams.append("redirect", redirectUri);
      authUrl.searchParams.append("response_type", "code"); // Usually 'code' for this flow
      authUrl.searchParams.append("state", state);
      authUrl.searchParams.append("loginMethod", "phone");
      authUrl.searchParams.append("type", "phone");
      // Add scopes if needed: authUrl.searchParams.append('scope', IFLOW_CONSTANTS.SCOPES.join(' '));

      console.log("Opening browser for authentication...");
      console.log(`URL: ${authUrl.toString()}`);

      // 5. Open Browser
      await open(authUrl.toString());
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

async function exchangeCodeForToken(code: string): Promise<IflowToken> {
  const response = await fetch(IFLOW_CONSTANTS.TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded", // or 'application/json' depending on API
      "User-Agent": IFLOW_CONSTANTS.USER_AGENT,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      client_id: IFLOW_CONSTANTS.CLIENT_ID,
      // client_secret might be needed if it's a confidential client,
      // but usually not for public CLI apps unless there's a proxy.
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<IflowToken>;
}
