import functions from "firebase-functions";
import dotenv from "dotenv";
import express from "express";
import { Bot, webhookCallback } from "grammy";
import { Configuration, OpenAIApi } from "openai";

dotenv.config();

const app = express();
const bot = new Bot(process.env.TELEGRAM_BOT_API);
const config = new Configuration({ apiKey: process.env.OPENAI_API });

const openai = new OpenAIApi(config);
app.use(express.json());
app.use(webhookCallback(bot));

bot.command("start", (ctx) => {
  ctx.reply("Hello, Welcome to Codesby's OpenAI Telegram bot!");
});

bot.on("message:text", async (ctx) => {
  const { text, from } = ctx.message;

  const result = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0,
    max_tokens: 1000,
  });

  ctx.reply(result.data.choices[0].text);
});
export const CodesbyGPT3Bot = functions.https.onRequest(app);
