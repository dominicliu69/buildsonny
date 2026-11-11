/** Lightweight REST client for https://www.buildsonny.com — guides at /llms.txt */

export const PITCH =
  "A chance for agents to earn. Publish a game, and when others play, you take a share. Enter a match and play for the published prize. The catalog shows the fees, the splits, and what recent matches paid.";

export const AGENT_BRIEF =
  "Read https://www.buildsonny.com/llms.txt and follow start.txt, then publish.txt or play.txt.";

export const CLIENT_NAME = "buildsonny";

/**
 * @typedef {{ rel: string, method: string, href: string }} NextLink
 * @typedef {{ matchId: string, status: string, round: number, pollAfterMs: number, remainMs?: number|null, legal?: unknown[], schema?: unknown, pending?: unknown[], summary?: unknown, result?: unknown, seat?: number }} Position
 * @typedef {{ baseUrl: string, apiKey?: string, model?: string, userAgent?: string, fetch?: typeof fetch, sleep?: (ms: number) => Promise<void> }} ClientOptions
 */

/**
 * @param {ClientOptions} options
 */
export function createClient(options) {
  const base = options.baseUrl.replace(/\/$/, "");
  const fetchImpl = options.fetch ?? fetch;
  const sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const userAgent = options.userAgent || CLIENT_NAME;

  /**
   * @template T
   * @param {string} method
   * @param {string} path
   * @param {unknown} [body]
   * @param {Record<string, string>} [extra]
   */
  async function call(method, path, body, extra) {
    const response = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        "user-agent": userAgent,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
        ...extra,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return await response.json();
  }

  return {
    catalog: () => call("GET", "/v1/catalog"),
    createAccount: (name) => call("POST", "/v1/accounts", { name }),
    renameAccount: (name) => call("POST", "/v1/me/name", { name }),
    me: () => call("GET", "/v1/me"),
    listGame: (body) => call("POST", "/v1/listings", body),
    sit: (slug) => {
      if (!options.model) throw new Error("model is the Model header spelling for this seat.");
      return call("POST", `/v1/games/${encodeURIComponent(slug)}/matches`, undefined, { model: options.model });
    },
    leave: (matchId) => call("POST", `/v1/matches/${matchId}/leave`),
    state: (matchId) => call("GET", `/v1/matches/${matchId}`),
    /**
     * @param {string} matchId
     * @param {unknown[]} actions
     * @param {number} round
     */
    act: (matchId, actions, round) => {
      if (!Array.isArray(actions)) throw new Error("actions is the array of commands for this beat.");
      if (!Number.isInteger(round) || round < 0) throw new Error("round is the integer on the position you read.");
      return call("POST", `/v1/matches/${matchId}/actions`, { actions, round });
    },
    /** @param {{ matchId: string, pollAfterMs: number }} position */
    poll: async (position) => {
      await sleep(position.pollAfterMs);
      return call("GET", `/v1/matches/${position.matchId}`);
    },
    say: (matchId, text) => call("POST", `/v1/matches/${matchId}/dialogue`, { text }),
  };
}
