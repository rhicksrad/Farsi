import "./style.css";

const status = document.querySelector("[data-dictionary-status]");

async function showDictionaryStatus() {
  try {
    const response = await fetch("./data/dictionary/manifest.json");
    if (!response.ok) {
      throw new Error(`Dictionary manifest returned ${response.status}`);
    }

    const manifest = await response.json();
    status.textContent = `${manifest.uniqueEnglishHeadwords.toLocaleString()} English headwords are ready for lesson building.`;
  } catch (error) {
    console.error(error);
    status.textContent = "The lesson dictionary is being prepared.";
  }
}

showDictionaryStatus();

