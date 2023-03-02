import { Configuration, OpenAIApi } from "openai";
import { Context, Filter } from "grammy";

export async function chatGPT(text: string) {
  try {
    const config = new Configuration({ apiKey: process.env.OPENAI_API });
    const openai = new OpenAIApi(config);
    const result = await openai.createCompletion({
      model: "gpt-3.5-turbo",
      prompt: text,
      temperature: 0,
      max_tokens: 1000,
    });
    return result.data.choices[0].text || "";
  } catch (error) {
    console.log(error);

    throw new Error("Something went wrong");
  }
}

export const onMention = async (ctx: Filter<Context, "message::mention">) => {
  const type = ctx.chat.type;
  try {
    const bot = await ctx.api.getMe();
    const me = `@${bot.username}`;
    const regex = new RegExp(`${me}`, "i");
    const text = ctx.message?.text || "";
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
