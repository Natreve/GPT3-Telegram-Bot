import functions from "firebase-functions";
import dotenv from "dotenv";
import express from "express";
import { Bot, webhookCallback, Context } from "grammy";
import { Configuration, OpenAIApi } from "openai";
dotenv.config();

const app = express();
const bot = new Bot(process.env.TELEGRAM_BOT_API);
const config = new Configuration({ apiKey: process.env.OPENAI_API });
const openai = new OpenAIApi(config);

app.use(express.json());
app.use(webhookCallback(bot));

async function chatGPT(text) {
  const result = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0,
    max_tokens: 1000,
  });
  return result.data.choices[0].text;
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

    if (ctx.message?.reply_to_message) {
      const from = ctx.message.reply_to_message.from;

      if (from?.id === bot.botInfo.id) {
        ctx.replyWithChatAction("typing", {
          message_thread_id: ctx.message?.message_thread_id,
        });
        const contextQuery = `ChatGPT: ${ctx.message.reply_to_message.text}\nMe: ${ctx.message.text}\nChatGPT: `;

        const response = await chatGPT(contextQuery);
        return ctx.reply(response, {
          reply_to_message_id: ctx.message?.message_id,
          message_thread_id: ctx.message?.message_thread_id,
        });
      }
    }

    if (ctx.message.is_topic_message) {
      ctx.replyWithChatAction("typing", {
        message_thread_id: ctx.msg.message_thread_id,
      });

      const response = await chatGPT(text);

      await ctx.reply(response, {
        reply_to_message_id: ctx.msg.message_id,
        message_thread_id: ctx.msg.message_thread_id,
      });
      return 0;
    }
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
  switch (type) {
    case "supergroup":
      responseToMessage(ctx);
      break;

    default:
      break;
  }
});

export const CodesbyGPT3Bot = functions.https.onRequest(app);
