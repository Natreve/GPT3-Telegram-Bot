import functions from "firebase-functions";
import dotenv from "dotenv";
import express from "express";
import { Bot, webhookCallback, Context } from "grammy";
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
async function limitReached(ctx) {
  const { from } = ctx.message;
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

    if (rejectedAlready) {
      let msg = `${from.first_name}! I said check back in:\n\`\`\`\n${duration}\`\`\``;
      await ctx.replyWithChatAction("typing");
      await ctx.replyWithSticker(
        "CAACAgEAAxkBAAICq2O5Dpr-l6eGipAAAYTbWCVE_xpxJwAC-gADXPhGAT8ZTzRur3DtLQQ"
      );
      await ctx.reply(msg, { parse_mode: "Markdown" });
      return true;
    }

    rejectedAlready = true;
    let msg = `${from.first_name}!, I'm tired of answering questions check back in: \n\`\`\`javascript\n${duration}\`\`\``;
    await ctx.replyWithChatAction("typing");
    await ctx.replyWithSticker(
      "CAACAgIAAxkBAAICl2O5DSC5haQvjUAT2uecpbOPcIW5AALkCgACs9mhS1dxjWcuKgAB4i0E"
    );
    await ctx.reply(msg, { parse_mode: "Markdown" });

    return true;
  }

  // Increment the value and return the new value
  counter++;
  return false;
}
async function responsePrivately(ctx) {
  if (await limitReached(ctx)) return;
  const { text } = ctx.message;
  // const response = await gtpRespond(text);
  // await ctx.reply(response);
  await ctx.reply(
    "Sorry but I am no longer able to answer questions privately"
  );
  return 0;
}
/**
 *
 * @param {Context} ctx
 * @returns
 */
async function responseToMessage(ctx) {
  try {
    const { text } = ctx.message;
    const me = `@${bot.botInfo.username}`;
    const regex = new RegExp(`${me}`, "i");
    if (!regex.test(text)) return;
    if (ctx.message.is_topic_message) {
      ctx.replyWithChatAction("typing", {
        message_thread_id: ctx.msg.message_thread_id,
      });

      const response = await gtpRespond(text);

      await ctx.reply(response, {
        reply_to_message_id: ctx.msg.message_id,
        message_thread_id: ctx.msg.message_thread_id,
      });
      return 0;
    }
    await ctx.reply("Sorry, I only reply in topics", {
      reply_to_message_id: ctx.msg.message_id,
    });
  } catch (error) {
    await ctx.reply("Sorry, I am experiencing some technical difficulty", {
      reply_to_message_id: ctx.msg.message_id,
    });
  }
}
bot.command("start", (ctx) => {
  ctx.reply("🤖");
  ctx.reply("Hello, I'm CodesbyBot, a OpenAI Telegram bot!");
});

bot.on("message:text", async (ctx) => {
  const { type } = ctx.chat;

  if (type === "private") return responsePrivately(ctx);

  return responseToMessage(ctx);
});

export const CodesbyGPT3Bot = functions.https.onRequest(app);
