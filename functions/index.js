import functions from "firebase-functions";
import dotenv from "dotenv";
import express from "express";
import { Bot, webhookCallback } from "grammy";
import { Configuration, OpenAIApi } from "openai";
import Sugar from "sugar";
import { DateTime } from "luxon";
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

let counter = 0;
let limit = 10;
let later = Sugar.Date.create("1 hour from now").getTime();
let rejectedAlready = false;
function limitReached() {
  if (counter >= limit) {
    let now = new Date().getTime();
    if (now >= later) {
      // Reset the counter and return a false indicating the reset and the limit is not reached
      counter = 0;
      rejectedAlready = false;
      return false;
    }
    let d1 = DateTime.fromMillis(now);
    let d2 = DateTime.fromMillis(later);
    const duration = d2
      .diff(d1)
      .toFormat("h 'hours' m 'minutes and' s 'seconds'");
    // Return the duration until limit reset indicating the limit has also been reached

    return duration;
  }

  // Increment the value and return the new value
  counter++;
  return false;
}

bot.command("start", (ctx) => {
  ctx.reply("🤖");
  ctx.reply("Hello, I'm CodesbyBot, a OpenAI Telegram bot!");
});

bot.on("message:text", async (ctx) => {
  const { text, from } = ctx.message;
  const me = `@${bot.botInfo.username}`;
  const regex = new RegExp(`${me}`, "i");

  let duration = limitReached();
  if (rejectedAlready) {
    let msg = `check back in:\n\`\`\`\n${duration}\`\`\``;
    await ctx.replyWithChatAction("typing");
    await ctx.replyWithSticker(
      "CAACAgEAAxkBAAICq2O5Dpr-l6eGipAAAYTbWCVE_xpxJwAC-gADXPhGAT8ZTzRur3DtLQQ"
    );
    return ctx.reply(msg, { parse_mode: "Markdown" });
  }
  if (duration) {
    rejectedAlready = true;
    let msg = `${from.first_name}!, I'm tired of answering questions check back in: \n\`\`\`javascript\n${duration}\`\`\``;
    await ctx.replyWithChatAction("typing");
    await ctx.replyWithSticker(
      "CAACAgIAAxkBAAICl2O5DSC5haQvjUAT2uecpbOPcIW5AALkCgACs9mhS1dxjWcuKgAB4i0E"
    );
    return ctx.reply(msg, { parse_mode: "Markdown" });
  }

  if (ctx.chat.type === "private") {
    await ctx.replyWithChatAction("typing");
    await ctx.reply("🤖");
    const response = await gtpRespond(text);
    await ctx.reply(response);
    return;
  }
  if (!regex.test(text)) return;
  await ctx.replyWithChatAction("typing");
  await ctx.reply("🤖");
  const response = await gtpRespond(text);
  await ctx.reply(response, {
    reply_to_message_id: ctx.msg.message_id,
  });
});
export const CodesbyGPT3Bot = functions.https.onRequest(app);
