require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai");

if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "dev") {
  dotenv.config({path: path.resolve(__dirname, ".env")});
}

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(bodyParser.json());

app.use(express.static('public'));

app.post('/translate', async (req, res) => {
  const { text, direction } = req.body;

  let systemMessage;
  if (direction === 'danish_to_english') {
    systemMessage = 'You are a Danish-English dictionary. I will give you a word in Danish. Give me the information that would appear in a dictionary, including the translation, inflections, etc. Please include three example sentences with the Danish translation in parentheses at the end. Also please stylize your output a bit (bold/italic). The original word in the first line should be italic and not bold. The word you translate will from now on be thought of as the starting word.';
  } else {
    systemMessage = 'You are a English-Danish dictionary. I will give you a word in English. Give me the information that would appear in a dictionary, including the translation, inflections, etc. Please include three example sentences with the English translation in parentheses at the end. Also please stylize your output a bit (bold/italic). The original word in the first line should be italic and not bold. The word you translate will from now on be thought of as the starting word.';
  }

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          "role": "system",
          "content": systemMessage,
        },
        {
          "role": "user",
          "content": text,
        }
      ],
      temperature: 0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    });
    console.log(response.data.choices)
    res.json({
      systemMessage,
      assistantResponses: response.data.choices.map(choice => choice.message.content.trim())
    });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.post('/followup', async (req, res) => {
  const { text, previousConversations } = req.body;

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: previousConversations.concat([{ "role": "user", "content": text }]),
      temperature: 0.5,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      n: 1,
    });
    
    res.json(response.data.choices.map(choice => choice.message.content.trim()));
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started on port ${port}`));
