import * as functions from "firebase-functions";
import * as dotenv from "dotenv";
import * as express from "express";
import { Bot, webhookCallback, Context } from "grammy";
import { Configuration, OpenAIApi } from "openai";
dotenv.config();

const app = express();

const bot = new Bot(process.env.TELEGRAM_BOT_API as string);
const config = new Configuration({ apiKey: process.env.OPENAI_API });
const openai = new OpenAIApi(config);

app.use(express.json());
app.use(webhookCallback(bot));
/**
 *
 * @param {string} text - Something to ask the bot
 * @returns
 */
async function chatGPT(text: string) {
  const result = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0,
    max_tokens: 1000,
  });
  return result.data.choices[0].text || "";
}
/**
 *
 * @param {Context} ctx - The context of the chat
 */
async function onMessage(ctx: Context) {
  try {
    const me = `@${bot.botInfo.username}`;
    const regex = new RegExp(`${me}`, "i");
    const text = ctx.message?.text || "";
    switch (ctx.chat?.type) {
      case "private":
        break;
      case "supergroup":
        if (regex.test(text) && ctx.message?.is_topic_message) {
          ctx.replyWithChatAction("typing", {
            message_thread_id: ctx.message?.message_thread_id,
          });
          const response = await chatGPT(text);
          await ctx.reply(response, {
            reply_to_message_id: ctx.message?.message_id,
            message_thread_id: ctx.message?.message_thread_id,
          });
          break;
        }

        if (ctx.message?.reply_to_message) {
          const from = ctx.message.reply_to_message.from;

          if (from?.id === bot.botInfo.id) {
            ctx.replyWithChatAction("typing", {
              message_thread_id: ctx.message?.message_thread_id,
            });
            const contextQuery = `ChatGPT: ${ctx.message.reply_to_message.text}\nMe: ${ctx.message.text}\nChatGPT: `;

            const response = await chatGPT(contextQuery);
            ctx.reply(response, {
              reply_to_message_id: ctx.message?.message_id,
              message_thread_id: ctx.message?.message_thread_id,
            });
          }
        }
        break;

      default:
        break;
    }
  } catch (error) {
    ctx.reply("Something went wrong...", {
      reply_to_message_id: ctx.message?.message_id,
      message_thread_id: ctx.message?.message_thread_id,
    });
  }
}

bot.command("start", (ctx) => {
  ctx.reply("🤖");
  ctx.reply("Hello, I'm CodesbyBot, a OpenAI Telegram bot!");
});

bot.on("message:text", onMessage);

export const CodesbyGPT3Bot = functions.https.onRequest(app);
