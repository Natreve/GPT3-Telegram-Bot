declare namespace NodeJS {
  interface ProcessEnv {
    readonly OPENAI_API: string;
    readonly TELEGRAM_BOT_API: string;
    readonly RAPID_API: string;
  }
}
