import { IFLOW_CONSTANTS } from "./constants.js";
import { authorizeIflow, IflowToken } from "./iflow/oauth.js";

export const createIflowPlugin = (id: string = "iflow") => {
  return async (context: any) => {
    // const { client } = context;
    // Opencode client instance, useful for logging or UI interaction

    let token: IflowToken | null = null;

    const authenticate = async () => {
      try {
        // Starts local server and opens browser
        token = await authorizeIflow();
        return token;
      } catch (error) {
        console.error("Authentication failed:", error);
        throw error;
      }
    };

    return {
      auth: {
        provider: id,
        loader: async () => {
          if (!token) {
            // Check for cached token here in a real app
            await authenticate();
          }

          return {
            apiKey: token?.access_token || "",
            baseURL: IFLOW_CONSTANTS.API_BASE_URL,
            fetch: async (url: string, init: any) => {
              const headers = {
                ...init?.headers,
                Authorization: `Bearer ${token?.access_token}`,
              };
              return fetch(url, { ...init, headers });
            },
          };
        },
        methods: {
          login: authenticate,
          logout: async () => {
            token = null;
          },
        },
      },
    };
  };
};

export const IflowOAuthPlugin = createIflowPlugin();
