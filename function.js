import { openai } from "./openai.js";
import math from "advanced-calculator";

const question = process.argv[2] || "hi";

const messages = [
  {
    role: "user",
    content: question,
  },
];

const functions = {
  calculate: ({ expression }) => {
    return math.evaluate(expression);
  },
  async generateImage({ prompt }) {
    const result = await openai.images.generate({ prompt });
    console.log(result);
    return result.data;
  },
};

const getCompletions = (messages) => {
  return openai.chat.completions.create({
    model: "gpt-3.5-turbo-0613",
    messages,
    functions: [
      {
        name: "calculate",
        description: "Execute a math expression",
        parameters: {
          type: "object",
          properties: {
            expression: {
              type: "string",
              description:
                'The math expression to evaluate like "2 * 3 + (21 / 2) ^ 2"',
            },
          },
          required: ["expression"],
        },
      },
      {
        name: "generateImage",
        description: "Create or generate an image based on description",
        parameters: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "The description of the image to generate",
            },
          },
          required: ["prompt"],
        },
      },
    ],
    temperature: 0,
  });
};

let response;
while (true) {
  response = await getCompletions(messages);
  if (response.choices[0].finish_reason === "stop") {
    break;
  } else if (response.choices[0].finish_reason === "function_call") {
    const fnName = response.choices[0].message.function_call.name;
    const args = response.choices[0].message.function_call.arguments;

    const fnToCall = await functions[fnName];
    const params = JSON.parse(args);

    const result = fnToCall(params);

    messages.push({
      role: "assistant",
      content: null,
      function_call: {
        name: fnName,
        arguments: args,
      },
    });

    messages.push({
      role: "function",
      name: fnName,
      content: JSON.stringify({ result }),
    });
  }
}
