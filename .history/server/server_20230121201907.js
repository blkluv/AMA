import express from 'express'
import * as dotenv from 'dotenv'
import cors from 'cors'
import { Configuration, OpenAIApi } from 'openai'

dotenv.config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const app = express()
app.use(cors())
app.use(express.json())

app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello from CodeX!'
  })
})

app.post('/', async (req, res) => {
  try {
    const prompt = req.body.prompt;

    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}`,
      temperature: 0, 
      max_tokens: 3000, 
      top_p: 1, 
      frequency_penalty: 0.5, 
      presence_penalty: 0, 
    });

    res.status(200).send({
      bot: response.data.choices[0].text
    });

  } catch (error) {
    console.error(error)
    res.status(500).send(error || 'Something went wrong');
  }
})

app.listen(5000, () => console.log('AI server started on http://localhost:5000'))

const fs = require("fs");
const openai = require("openai");
openai.apiKey = OPENAI_API_KEY;

let fine_tuned_model_id = null;

function updateModelId() {
    // Reading the fine-tuning data file
    fs.readFile("arvr_ama_bot_data.jsonl", "utf8", (err, data) => {
        if (err) {
            console.error(err);
            return;
        }

        // Parsing the data from jsonl file
        const examples = data.split("\n").map(JSON.parse);
        const prompt = "What is your name?";

        openai
            .createCompletion({
                engine: "text-davinci-002",
                prompt: prompt,
                examples: examples,
                maxTokens: 1024,
                n: 1,
                stop: null,
                temperature: 0.5,
            })
            .then((response) => {
                // Updating the fine-tuned model id
                fine_tuned_model_id = response.data.model;
                console.log(`Fine-tuned model id updated: ${fine_tuned_model_id}`);
            })
            .catch((error) => {
                console.error(error);
            });
    });
}

// Call the function to update the model id
updateModelId();

// Function to generate responses using the fine-tuned model
function generateResponse(prompt) {
    openai
        .Completion.create({
            engine: fine_tuned_model_id,
            prompt: prompt,
            maxTokens: 1024,
            n: 1,
            stop: null,
            temperature: 0.5,
        })
        .then((response) => {
            console.log(response.choices[0].text);
        })
        .catch((error) => {
            console.error(error);
            // If the model id is invalid, update the model id and try again
            if (error.statusCode === 401) {
                updateModelId();
                generateResponse(prompt);
            }
        });
}