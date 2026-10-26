const input = document.getElementById("input");
const search = document.getElementById("search");
const container = document.getElementById("display");
const loading = document.getElementById("loading");
const errorDiv = document.getElementById("error-div");

async function fetchData(word) {
  if (!word) {
    errorDiv.innerHTML = "Please enter a word";
    container.innerHTML = "";
    return;
  }

  try {
    loading.hidden = false;
    errorDiv.innerHTML = "";

    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    );
    console.log(response);

    if (response.status === 502 || response.status === 503) {
      throw new Error("SERVER_ERROR");
    }

    if (response.status === 404) {
      throw new Error("WORD_NOT_FOUND");
    }

    if (!response.ok) {
      throw new Error("OTHER_ERROR");
    }
    const data = await response.json();
    if (
      !Array.isArray(data) ||
      !data[0]?.word ||
      !Array.isArray(data[0]?.meanings)
    ) {
      throw new Error("INVALID_DATA");
    }

    displayData(data);
    console.log(data);
  } catch (error) {
    console.error("Error fetching dictionary:", error);

    if (!navigator.onLine) {
      errorDiv.textContent =
        "You may be offline. Please check your internet connection and try again.";
    } else if (error.message === "SERVER_ERROR") {
      errorDiv.textContent =
        "Our dictionary is temporarily unavailable. Please try again in a moment.";
    } else if (error.message === "WORD_NOT_FOUND") {
      errorDiv.textContent =
        "Word not found. Please check the spelling and try again.";
    } else if (error instanceof TypeError) {
      errorDiv.textContent =
        "Unable to connect to the dictionary. Please check your connection and try again.";
    } else if (error.message === "INVALID_DATA") {
      errorDiv.textContent =
        "We received an unexpected response. Please try again.";
    } else {
      errorDiv.textContent = "Something went wrong. Please try again.";
    }

    container.innerHTML = "";
  } finally {
    loading.hidden = true;
  }
}
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    fetchData(input.value.trim());
  }
});
search.addEventListener("click", (event) => {
  event.preventDefault();
  container.innerHTML = "";
  fetchData(input.value.trim());
});

function displayData(data) {
  container.innerHTML = "";

  const title = document.createElement("h1");
  title.textContent = `Word: ${data[0].word}`;

  container.append(title);
  const phonetics = data[0].phonetics || [];
  const phoneticData = phonetics.find((item) => item.text);

  if (phoneticData) {
    const phoneticText = document.createElement("p");
    phoneticText.textContent = phoneticData.text;
    container.append(phoneticText);
  }

  const speakButton = document.createElement("button");
  speakButton.textContent = "🔊 Hear pronunciation";
  speakButton.classList.add("speakBtn");
  const speechSupported =
    "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  if (speechSupported) {
    speakButton.addEventListener("click", () => {
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(data[0].word);
      speech.lang = "en-US";

      window.speechSynthesis.speak(speech);
    });
  } else {
    speakButton.disabled = true;
    speakButton.textContent = "Pronunciation unavailable";
    speakButton.title = "Your browser does not support speech synthesis.";
  }

  container.append(speakButton);
  data[0].meanings.forEach((meaning) => {
    const partOfSpeech = document.createElement("h3");
    partOfSpeech.textContent = meaning.partOfSpeech;
    container.append(partOfSpeech);

    if (meaning.synonyms && meaning.synonyms.length > 0) {
      const synonyms = document.createElement("p");
      synonyms.textContent = `Synonyms: ${meaning.synonyms.join(", ")}`;
      container.append(synonyms);
    }

    meaning.definitions.forEach((definition) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = definition.definition;
      container.append(paragraph);
    });
  });
}
