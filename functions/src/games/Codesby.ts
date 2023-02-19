import { Configuration, OpenAIApi } from "openai";
import { Context, Filter } from "grammy";
const config = new Configuration({ apiKey: process.env.OPENAI_API });
const openai = new OpenAIApi(config);

async function chatGPT(text: string) {
  const result = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: text,
    temperature: 0,
    max_tokens: 1000,
  });
  return result.data.choices[0].text || "";
}

export const onMention = async (ctx: Filter<Context, "message::mention">) => {
  const type = ctx.chat.type;
  const bot = await ctx.api.getMe();
  const me = `@${bot.username}`;
  const regex = new RegExp(`${me}`, "i");
  const text = ctx.message?.text || "";
  try {
    switch (type) {
      case "group": {
        if (regex.test(text)) {
          ctx.replyWithChatAction("typing");
          const response = await chatGPT(text);
          await ctx.reply(response);
        }
        return;
      }
      case "supergroup": {
        if (regex.test(text)) {
          ctx.replyWithChatAction("typing", {
            message_thread_id: ctx.message.message_thread_id,
          });
          const response = await chatGPT(text);
          await ctx.reply(response, {
            reply_to_message_id: ctx.message.message_id,
            message_thread_id: ctx.message.message_thread_id,
          });
        }
        return;
      }

      default:
        return;
    }
  } catch (error) {
    switch (type) {
      case "group":
        ctx.reply("Something went wrong...", {
          reply_to_message_id: ctx.message.message_id,
        });
        break;
      case "supergroup":
        ctx.reply("Something went wrong...", {
          reply_to_message_id: ctx.message.message_id,
          message_thread_id: ctx.message.message_thread_id,
        });
        break;

      default:
        break;
    }
  }
};
