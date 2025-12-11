#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Get config from environment variables
const API_KEY = process.env.NEW_DAY_API_KEY;
const API_URL = process.env.NEW_DAY_API_URL || "https://us-central1-new-day-69f04.cloudfunctions.net";

const server = new Server(
  {
    name: "new-day-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_task",
        description: "Add a task to the user's New Day task management app. Use this when the user asks you to remember something, add a todo, or create a task.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The task description",
            },
            type: {
              type: "string",
              enum: ["Most", "Other", "Quick", "PDP"],
              description: "Task type: Most (most important), Other (backlog), Quick (quick tasks), PDP (pass/delegate/postpone). Defaults to Other.",
            },
            notes: {
              type: "string",
              description: "Optional notes or additional details for the task",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "list_days",
        description: "List recent days from the user's New Day app. Use this to see what days are available if you need to add a task to a specific day.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!API_KEY) {
    return {
      content: [
        {
          type: "text",
          text: "Error: NEW_DAY_API_KEY environment variable is not set. Please configure it in your Claude Desktop settings.",
        },
      ],
    };
  }

  try {
    if (name === "add_task") {
      const response = await fetch(`${API_URL}/addTask`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: args?.text,
          type: args?.type || "Other",
          notes: args?.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error adding task: ${data.message}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `Task added successfully! Task ID: ${data.taskId}, Day ID: ${data.dayId}`,
          },
        ],
      };
    }

    if (name === "list_days") {
      const response = await fetch(`${API_URL}/listDays`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          content: [
            {
              type: "text",
              text: `Error listing days: ${data.message}`,
            },
          ],
        };
      }

      const daysList = data.days
        .map((d: { id: string; created: string }) => `- ${d.id}: ${d.created}`)
        .join("\n");

      return {
        content: [
          {
            type: "text",
            text: `Found ${data.days.length} recent days:\n${daysList}`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Unknown tool: ${name}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("New Day MCP server running on stdio");
}

main().catch(console.error);
