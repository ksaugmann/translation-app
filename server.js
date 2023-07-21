require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai");

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
    systemMessage = 'You are a helpful translator. I will provide you with a word in Danish and then you will give me various information about the word in English. First the direct translation formatted in this way: [input word] means [output]. The input word should be italicized and the output word in bold. Directly after that in parentheses show the word division of the English word. Then tell me what kind of word the output is - is it a noun, verb, etc. Then give me the inflections of the English word in a concise one-liner. Then tell me the meaning of it. Then give me three example sentences where you translate the word from Danish to English. My input should from now on be thought of as the starting-word.';
  } else {
    systemMessage = 'You are a helpful translator. I will provide you with a word in English and then you will give me various information about the word in Danish. First the direct translation formatted in this way: [input word] means [output]. The input word should be italicized and the output word in bold. Directly after that in parentheses show the word division of the Danish word. Then tell me what kind of word the output is - is it a noun, verb, etc. Then give me the inflections of the Danish word in a concise one-liner. Then tell me the meaning of it. Then give me three example sentences where you translate the word from English to Danish. My input should from now on be thought of as the starting-word.';
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
