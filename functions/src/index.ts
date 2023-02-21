import admin from "firebase-admin";
import functions from "firebase-functions";
import express from "express";
// import fs from "fs-extra";
import * as dotenv from "dotenv";
import * as Codesby from "./games/Codesby.js";
import * as randomQuestions from "./games/randomQuestions.js";
import wouldYouRather from "./games/wouldYouRather.js";
import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import { Context, session, SessionFlavor } from "grammy";
import { Conversation, ConversationFlavor } from "@grammyjs/conversations";
import { conversations, createConversation } from "@grammyjs/conversations";
dotenv.config();

interface SessionData {
  group: string | null;
  msg: number | undefined;
}
type MyContext = Context & ConversationFlavor & SessionFlavor<SessionData>;
type MyConversation = Conversation<MyContext>;

const app = express();
const bot = new Bot<MyContext>(process.env.TELEGRAM_BOT_API as string);

// const serviceAccount = fs.readJSONSync("../service-account.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
const credential = admin.credential.applicationDefault();
admin.initializeApp({ credential });

// Install session middleware, and define the initial session value.
function initial(): SessionData {
  return { group: null, msg: undefined };
}

async function anwserQuestion(convo: MyConversation, ctx: MyContext) {
  try {
    if (ctx.session && ctx.session.group) {
      const group = ctx.session.group;
      const msg = ctx.session.msg;
      await ctx.reply(`👀 What's your answer to the question?`);
      const { message } = await convo.waitFor(":text");
      await bot.api.sendMessage(group, `🕵️‍♀️ *${message?.text}*`, {
        reply_to_message_id: msg,
        parse_mode: "MarkdownV2",
      });
    }
  } catch (error) {
    console.log(error);
  }
}
bot.use(session({ initial }));
bot.use(conversations());
bot.use(createConversation(anwserQuestion));

bot.api.setMyCommands([
  { command: "wouldyou", description: "Would you rather" },
  { command: "question", description: "Random Question" },
]);
bot.command("start", async (ctx) => {
  try {
    if (ctx.match) {
      const [game, group, msg] = ctx.match.split("_");
      if (game === "question" && ctx.session) {
        ctx.session.group = group;
        ctx.session.msg = parseInt(msg);
        await ctx.conversation.enter("anwserQuestion");
      }
      return;
    }
  } catch (error) {}
});
bot.chatType(["group", "supergroup"]).command("wouldyou", async (ctx) => {
  try {
    const { question, options } = await wouldYouRather();
    await bot.api.sendPoll(ctx.chat.id, question, options);
    return;
  } catch (error) {
    console.log(error);
  }
});
bot.chatType(["group", "supergroup"]).command("question", async (ctx) => {
  const question = await randomQuestions.getRandom();
  const keyboard = new InlineKeyboard();
  const ctx2 = await ctx.reply(question);

  keyboard.url(
    "🕵️‍♀️ Anonymous Answer",
    `https://t.me/CodesbyBot?start=question_${ctx.chat.id}_${ctx2.message_id}`
  );

  await ctx.reply(`You can answer this question *anonymously*\\! 🕵️‍♀️💬`, {
    reply_markup: keyboard,
    parse_mode: "MarkdownV2",
    reply_to_message_id: ctx2.message_id,
  });
  return;
});

bot.chatType(["group", "supergroup"]).on("message::mention", Codesby.onMention);

app.use(express.json());
app.use(webhookCallback(bot));

// bot.start();
export const CodesbyGPT3Bot = functions.https.onRequest(app);
