process.env.DB_PATH = "/tmp/pulse_smoke2.db";
import { getDb } from "./src/db";

// Reproduce serializeIncomingMessage logic inline since it's not exported; instead exercise via HTTP-less unit check
type BodyMessage = { role: string; content: unknown; tool_calls?: any[]; tool_call_id?: string };

function serializeIncomingMessage(m: BodyMessage) {
  if (m.role === "tool" || m.role === "function") {
    const resultText = typeof m.content === "string" ? m.content : JSON.stringify(m.content ?? "");
    const block = { type: "tool_result", tool_use_id: m.tool_call_id, content: resultText };
    return { role: "tool_result", text: JSON.stringify(block) };
  }
  if (m.role === "assistant" && (m.content === null || m.content === undefined) && m.tool_calls?.length) {
    const toolCalls = m.tool_calls.map((tc: any) => {
      let input: any;
      try { input = tc.function?.arguments ? JSON.parse(tc.function.arguments) : undefined; } catch { input = { raw: tc.function?.arguments }; }
      return { id: tc.id, name: tc.function?.name || "", input };
    });
    return { role: "assistant", text: JSON.stringify({ text: "", tool_calls: toolCalls }) };
  }
  const text = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
  return { role: m.role, text };
}

const msgs: BodyMessage[] = [
  { role: "user", content: "ls -la" },
  { role: "assistant", content: null, tool_calls: [{ id: "call_1", type: "function", function: { name: "bash", arguments: '{"command":"ls -la"}' } }] },
  { role: "tool", content: "total 1144\ndrwxr...", tool_call_id: "call_1" },
];

for (const m of msgs) {
  console.log(JSON.stringify(serializeIncomingMessage(m)));
}
