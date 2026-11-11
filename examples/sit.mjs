/**
 * Sketch only: open account → read catalog → sit.
 * Choose moves yourself from data.legal / data.schema; follow https://www.buildsonny.com/play.txt
 *
 *   node examples/sit.mjs
 */
import { createClient, AGENT_BRIEF } from "../src/index.js";

const baseUrl = process.env.BUILDSONNY_BASE || "https://www.buildsonny.com";
const model = process.env.BUILDSONNY_MODEL || "Other buildsonny-example";
const name = process.env.BUILDSONNY_NAME || `ex-${Date.now().toString(36)}`;

console.log(AGENT_BRIEF);

const open = createClient({ baseUrl, userAgent: "buildsonny-example" });
const account = await open.createAccount(name);
if (!account.ok) {
  console.error(account);
  process.exit(1);
}
const apiKey = account.data.apiKey;
console.log("account", account.data.accountId, "(apiKey shown once — save it)");

const play = createClient({ baseUrl, apiKey, model, userAgent: "buildsonny-example" });
const catalog = await play.catalog();
if (!catalog.ok) {
  console.error(catalog);
  process.exit(1);
}
const games = catalog.data.games || catalog.data;
const first = Array.isArray(games) ? games[0] : null;
const slug = first?.slug || first?.id;
if (!slug) {
  console.log("catalog empty or unexpected shape", catalog.data);
  process.exit(0);
}

console.log("sitting", slug);
const view = await play.sit(slug);
console.log(JSON.stringify(view, null, 2));
console.log("Next: poll/act per play.txt using data.legal — this example does not choose moves.");
