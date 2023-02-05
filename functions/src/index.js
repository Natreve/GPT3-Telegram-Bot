"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.CodesbyGPT3Bot = void 0;
var functions = require("firebase-functions");
var dotenv = require("dotenv");
var express = require("express");
var grammy_1 = require("grammy");
var openai_1 = require("openai");
dotenv.config();
var app = express();
var bot = new grammy_1.Bot(process.env.TELEGRAM_BOT_API);
var config = new openai_1.Configuration({ apiKey: process.env.OPENAI_API });
var openai = new openai_1.OpenAIApi(config);
app.use(express.json());
app.use((0, grammy_1.webhookCallback)(bot));
function ChatGPT(text) {
    return __awaiter(this, void 0, void 0, function () {
        var result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, openai.createCompletion({
                        model: "text-davinci-003",
                        prompt: text,
                        temperature: 0,
                        max_tokens: 1000
                    })];
                case 1:
                    result = _a.sent();
                    return [2 /*return*/, result.data.choices[0].text || ""];
            }
        });
    });
}
function onMessage(ctx) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return __awaiter(this, void 0, void 0, function () {
        var me, regex, text, _o, response, from, contextQuery, response, error_1;
        return __generator(this, function (_p) {
            switch (_p.label) {
                case 0:
                    _p.trys.push([0, 10, , 11]);
                    me = "@".concat(bot.botInfo.username);
                    regex = new RegExp("".concat(me), "i");
                    text = ((_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) || "";
                    _o = (_b = ctx.chat) === null || _b === void 0 ? void 0 : _b.type;
                    switch (_o) {
                        case "private": return [3 /*break*/, 1];
                        case "group": return [3 /*break*/, 2];
                    }
                    return [3 /*break*/, 8];
                case 1: return [3 /*break*/, 9];
                case 2:
                    if (!(regex.test(text) && ((_c = ctx.message) === null || _c === void 0 ? void 0 : _c.is_topic_message))) return [3 /*break*/, 5];
                    ctx.replyWithChatAction("typing", {
                        message_thread_id: (_d = ctx.message) === null || _d === void 0 ? void 0 : _d.message_thread_id
                    });
                    return [4 /*yield*/, ChatGPT(text)];
                case 3:
                    response = _p.sent();
                    return [4 /*yield*/, ctx.reply(response, {
                            reply_to_message_id: (_e = ctx.message) === null || _e === void 0 ? void 0 : _e.message_id,
                            message_thread_id: (_f = ctx.message) === null || _f === void 0 ? void 0 : _f.message_thread_id
                        })];
                case 4:
                    _p.sent();
                    return [3 /*break*/, 9];
                case 5:
                    if (!((_g = ctx.message) === null || _g === void 0 ? void 0 : _g.reply_to_message)) return [3 /*break*/, 7];
                    from = ctx.message.reply_to_message.from;
                    if (!((from === null || from === void 0 ? void 0 : from.id) === bot.botInfo.id)) return [3 /*break*/, 7];
                    ctx.replyWithChatAction("typing", {
                        message_thread_id: (_h = ctx.message) === null || _h === void 0 ? void 0 : _h.message_thread_id
                    });
                    contextQuery = "ChatGPT: ".concat(ctx.message.reply_to_message.text, "\nMe: ").concat(ctx.message.text, "\nChatGPT: ");
                    return [4 /*yield*/, ChatGPT(contextQuery)];
                case 6:
                    response = _p.sent();
                    ctx.reply(response, {
                        reply_to_message_id: (_j = ctx.message) === null || _j === void 0 ? void 0 : _j.message_id,
                        message_thread_id: (_k = ctx.message) === null || _k === void 0 ? void 0 : _k.message_thread_id
                    });
                    _p.label = 7;
                case 7: return [3 /*break*/, 9];
                case 8: return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 11];
                case 10:
                    error_1 = _p.sent();
                    ctx.reply("Something went wrong...", {
                        reply_to_message_id: (_l = ctx.message) === null || _l === void 0 ? void 0 : _l.message_id,
                        message_thread_id: (_m = ctx.message) === null || _m === void 0 ? void 0 : _m.message_thread_id
                    });
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
bot.command("start", function (ctx) {
    ctx.reply("🤖");
    ctx.reply("Hello, I'm CodesbyBot, a OpenAI Telegram bot!");
});
bot.on("message:text", onMessage);
exports.CodesbyGPT3Bot = functions.https.onRequest(app);
