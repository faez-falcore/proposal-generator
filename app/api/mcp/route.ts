import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { verifyMcpKey } from "./_lib/auth";
import { registerAllTools } from "./_tools";

async function handleMcpRequest(req: Request): Promise<Response> {
  const auth = await verifyMcpKey(req);
  if (!auth) {
    return new Response("Unauthorized", {
      status: 401,
      headers: { "WWW-Authenticate": 'Bearer realm="xma-proposals"' },
    });
  }

  const server = new McpServer({
    name: "xma-proposals",
    version: "1.1.0",
    instructions: `XMA animated proposal authoring server. MANDATORY RULES before calling create_animated_proposal:
1. Ask the rep section-by-section questions (A→G): identity/brand, problems (3 — name the exact tool/process/cost), solutions (3 mirroring problems), scope (8–16 deliverables), timeline, commercials, guarantee + T&C clause 03. Wait for answers after each group before proceeding to the next.
2. timeline_nodes[].days is the CUMULATIVE business day from onboarding kickoff. First node MUST be days:1 (kickoff). Each subsequent node must have a strictly higher day number. All days are business days.
3. Zero invention. Every dollar figure, metric, pain point, scope item, and guarantee must come from what the rep told you or from the snippet library. If unknown, ask — never guess.
4. Always show the full JSON payload to the rep for confirmation before calling create_animated_proposal.`,
  });
  registerAllTools(server, auth);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  await server.connect(transport);
  const response = await transport.handleRequest(req);
  await server.close();

  return response;
}

export { handleMcpRequest as GET, handleMcpRequest as POST, handleMcpRequest as DELETE };
