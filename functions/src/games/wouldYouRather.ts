import axios from "axios";
export default async function wouldYouRather() {
  try {
    const config = {
      url: "https://would-you-rather.p.rapidapi.com/wyr/random",
      method: "GET",
      headers: {
        "X-RapidAPI-Key": process.env.RAPID_API as string,
        "X-RapidAPI-Host": "would-you-rather.p.rapidapi.com",
      },
    };
    const poll = { question: "", options: [] };
    const result = await axios(config);
    const question = result.data[0].question;
    const options = question.replace(/^.*rather\s+/, "");
    poll.question = "Would you rather";
    poll.options = options.split(/\s+or\s+/);

    return poll;
  } catch (error) {
    console.log(error);
    throw new Error("Something went wrong getting the question");
  }
}
