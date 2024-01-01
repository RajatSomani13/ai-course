import { openai } from "./openai.js";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const newMessage = async (history, message) => {
  const results = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [...history, message],
  });
  return results.choices[0].message;
};

const formatMessage = (userInput) => ({ role: "user", content: userInput });

const chat = () => {
  const history = [
    {
      role: "system",
      content:
        "You are an AI assistant, answer any questions to the best of your ability.",
    },
  ];

  const start = () => {
    rl.question("You: ", async (userInput) => {
      if (userInput.toLowerCase() === "exit") {
        rl.close();
        return;
      }
      // format user input
      const userMessage = formatMessage(userInput);
      // get response from gpt for the user input and the history
      const response = await newMessage(history, userMessage);
      // push the userMessage and response from GPT into history for next call
      history.push(userMessage, response);

      console.log(`\n\nAI: ${response.content}\n\n`);

      start();
    });
  };

  start();
};

console.log("Chattify is live now, please type 'exit' when you are done!");

chat();
