marked.setOptions({ breaks: true });

// Define predefined follow-up questions
const predefinedQuestions = [
  "How should it be pronounced?",
  'What are synonyms for this word?',
  'What are common mistakes with this word?',
];

// Define the corresponding actual requests for each question
const actualRequests = [
  'Please explain how the starting-word I just gave you as input should be pronounced. Please use The International Phonetic Alphabet representation as well as a simplified version using English-like spellings.',
  'What are synonyms for the starting-word?',
  'Please tell me about common mistakes for the word.',
];

document.getElementById('translation-form').addEventListener('submit', function (e) {
  e.preventDefault();

  const text = document.getElementById('text').value;
  const direction = document.querySelector('input[name="direction"]:checked').value;
  const button = document.querySelector('button');
  const disclaimerText = document.getElementById('disclaimer')

  button.disabled = true; // Disable the button

  button.classList.add('loading');  // Show the loading animation

  fetch('/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, direction }),
  })
    .then(response => response.json())
    .then(data => {
      button.classList.remove('loading');  // Hide the loading animation
      button.disabled = false; // Enable the button after getting the response
      disclaimerText.classList.add('disclaimer-non-visible')

      const resultsElement = document.getElementById('results');
      resultsElement.innerHTML = '';

      let cleanedData = data.assistantResponses[0].replace(/\n\n/g, '\n');

      const p = document.createElement('p');
      let htmlData = marked.parse(cleanedData);
      htmlData = htmlData.replace(/<br>/g, '<br><br>');
      p.innerHTML = htmlData;
      resultsElement.appendChild(p);

      // Initialize previousConversations
      previousConversations = [
        { role: 'system', content: data.systemMessage },
        { role: 'assistant', content: cleanedData },
      ];

      // Display follow-up questions
      const questionButtons = document.getElementById('question-buttons');
      questionButtons.style.display = 'block';

      // Trigger a reflow, flushing the CSS changes
      void questionButtons.offsetWidth;

      // Now setup the transition
      questionButtons.style.opacity = '1';
      questionButtons.style.transform = 'translateY(0)';

      for (let i = 1; i <= 3; i++) {
        const button = document.getElementById(`question-${i}`);
        button.textContent = predefinedQuestions[i - 1];
        button.onclick = (event) => handleFollowUpQuestion(actualRequests[i - 1], event);
      }

    })
    .catch(err => {
      button.classList.remove('loading');  // Hide the loading animation
      button.disabled = false; // Enable the button even if there's an error
      console.error(err);
    });
});

let previousConversations = [];

function handleFollowUpQuestion(request, event) {
  const button = event.target; // Get the button that triggered the event
  const allButtons = document.querySelectorAll('#question-1, #question-2, #question-3');

  // Show the loading animation on the clicked button
  button.classList.add('loading', 'hide-text');

  // Disable all the follow-up buttons
  allButtons.forEach(btn => btn.disabled = true);

  fetch('/followup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: request, previousConversations }),
  })
    .then(response => {
      if (!response.ok) { // Check if the response was successful
        throw new Error('Network response was not ok'); // This will be caught by the catch block below
      }
      return response.json(); // If the response was successful, continue with the original code
    })
    .then(data => {
      // Enable all the follow-up buttons after getting the response
      allButtons.forEach(btn => btn.disabled = false);
      button.classList.remove('loading', 'hide-text');  // Hide the loading animation

      const resultsElement = document.getElementById('results');
      const p = document.createElement('p');
      let htmlData = marked.parse(data[0]);
      htmlData = htmlData.replace(/<br>/g, '<br><br>');
      p.innerHTML = htmlData;
      resultsElement.appendChild(p);

      // Append to previous conversations
      previousConversations.push({
        role: "user",
        content: request // Change 'question' to 'request' here
      }, {
        role: "assistant",
        content: data[0]
      });
    })
    .catch(err => {
      button.classList.remove('loading', 'hide-text');  // Hide the loading animation
      // Enable all the follow-up buttons after getting the response
      allButtons.forEach(btn => btn.disabled = false);
      // Now, instead of just logging the error, also show a message to the user
      console.error(err);
      alert('Der opstod en fejl: ' + err.message + ' Prøv evt. igen.');
    });
}
