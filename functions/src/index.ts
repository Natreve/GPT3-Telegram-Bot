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
  id: string | null;
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
  return { id: null };
}

async function anwserQuestion(convo: MyConversation, ctx: MyContext) {
  const { id } = convo.session;
  if (!id) return;
  const response = await convo.external(async () => {
    const firestore = admin.firestore();
    const db = firestore.collection("questionAsked");

    const snapshot = await db.doc(id).get();

    if (!snapshot.exists) return null;

    return snapshot.data();
  });
  if (!response) return;
  await ctx.reply(
    `👀 What's your answer to the question: \\\n*${response.question}\\?*`,
    { parse_mode: "MarkdownV2" }
  );
  const { message } = await convo.waitFor(":text");

  await bot.api.sendMessage(response.chat_id, `🕵️‍♀️ *${message?.text}*`, {
    parse_mode: "MarkdownV2",
    reply_to_message_id: response.msg_id,
  });
  return;
}

bot.chatType(["group", "supergroup"]).command("wouldyou", async (ctx) => {
  const { question, options } = await wouldYouRather();

  await bot.api.sendPoll(ctx.chat.id, question, options, {
    message_thread_id: ctx.message.message_thread_id,
  });
  return;
});
bot.on(["poll", "poll_answer"], (ctx) => {
  //do nothing just handle poll error
  return;
});

bot.use(session({ initial }));
bot.use(conversations());
bot.use(createConversation(anwserQuestion));

bot.api.setMyCommands([
  { command: "wouldyou", description: "Would you rather" },
  { command: "question", description: "Random Question" },
]);
bot.command("start", async (ctx) => {
  if (ctx.match) {
    const [game, id] = ctx.match.split("_");

    switch (game) {
      case "question":
        ctx.session.id = id;
        await ctx.conversation.enter("anwserQuestion");
        break;

      default:
        break;
    }
    return;
  }

  // if (ctx.session.question) {
  //   await ctx.conversation.enter("anwserQuestion");
  // }
  return;
});

bot.chatType(["group", "supergroup"]).command("question", async (ctx) => {
  const firestore = admin.firestore();
  const db = firestore.collection("questionAsked");
  const doc = db.doc();
  const question = await randomQuestions.getRandom();
  const keyboard = new InlineKeyboard();

  keyboard.url(
    "🕵️‍♀️ Anonymous Answer",
    `https://t.me/CodesbyBot?start=question_${doc.id}`
  );
  const questionCtx = await ctx.reply(`*${question}*`, {
    reply_markup: keyboard,
    message_thread_id: ctx.message.message_thread_id,
    parse_mode: "MarkdownV2",
  });
  await db.doc(doc.id).set({
    question,
    chat_id: ctx.chat.id,
    msg_id: questionCtx.message_id,
  });

  return;
});

const pm = bot.filter((ctx) => ctx.chat?.type === "private");
pm.on("message:text", async (ctx) => {
  const allow = [parseInt(process.env.DQ), parseInt(process.env.AG)];
  const { from, text } = ctx.message;
  if (!allow.includes(from.id)) return;
  const response = await Codesby.chatGPT(text);
  return await ctx.reply(response);
});

bot.chatType(["group", "supergroup"]).on("message::mention", Codesby.onMention);

app.use(express.json());
app.use(webhookCallback(bot));

// bot.start();
// bot.catch((err) => {
//   console.log(err);

//   return;
// });
export const CodesbyGPT3Bot = functions.https.onRequest(app);
