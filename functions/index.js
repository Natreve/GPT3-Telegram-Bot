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

async function gtpRespond(text) {
  const result = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0,
    max_tokens: 1000,
  });
  return result.data.choices[0].text;
}

bot.command("start", (ctx) => {
  ctx.reply("🤖");
  ctx.reply("Hello, I'm CodesbyBot, a OpenAI Telegram bot!");
});

bot.on("message:text", async (ctx) => {
  const { text } = ctx.message;
  const me = `@${bot.botInfo.username}`;
  const regex = new RegExp(`${me}`, "i");

  if (ctx.chat.type === "private") {
    await ctx.reply("🤖");
    ctx.replyWithChatAction("typing");
    const response = await gtpRespond(text);
    await ctx.reply(response);
    return;
  }
  if (!regex.test(text)) return;
  await ctx.reply("🤖");
  ctx.replyWithChatAction("typing");
  const response = await gtpRespond(text);
  await ctx.reply(response, {
    reply_to_message_id: ctx.msg.message_id,
  });
});
export const CodesbyGPT3Bot = functions.https.onRequest(app);
