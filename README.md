# GPT3-Telegram-Bot

You can sign up at [Openai](https://beta.openai.com/account/api-keys) to create your api key. To create your api for your telegram bot, you can use the @BotFather in the telegram app. This project uses [firebase](https://firebase.google.com/) functions to host the bot. You can replace it with your own hosting or create a firebase account and follow their setup.

## SETUP

Add a `.env` file to the root directory with the following keys

```
OPENAI_API=<your token here>
TELEGRAM_BOT_API=<your token here>
```

If you are using firebase to host the bot you can go ahead and follow the instructions below:

1. In the route folder Run `firebase init` and follow the prompts to setup your project, make sure firebase functions is selected.
2. Navigate to the functions folder and run `npm i` to install all dependencies
3. Run `firebase deploy` to deploy the function. You'll need the function url for the next step.

There are two ways how your bot can receive messages from the Telegram servers. They are called long polling and webhooks. You can learn more about this here [grammy](https://grammy.dev/guide/deployment-types.html).

In this project we use webhooks which requires that you set the firebase function url to the telegram bot. You can learn more here [telegram core](https://core.telegram.org/bots/webhooks#how-do-i-set-a-webhook-for-either-type).

You can run this curl command replacing the url and token space holders with your firebase and telegram bot api key.
```
curl -F "url=https://<YOUR FIREBASE FUNCTION URL>" https://api.telegram.org/bot<YOUR TELEGRAM TOKEN>/setWebhook
```
Your bot is now ready!, send the bot a message on telegram and it should use the openai to respond to your message!. It's also a good idea to ensure your bot is made private so others can't use it.