import { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/solid";

export default function App() {
  const [notes, setNotes] = useState("");
  const [allNotes, setAllNotes] = useState([]);
  const [result, setResult] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["researchNotes"], (data) => {
      if (data.researchNotes) setAllNotes(data.researchNotes);
    });
  }, []);

  const saveNotes = () => {
    if (!notes.trim()) return alert(" Note cannot be empty!");
    const updatedNotes = [...allNotes, { id: Date.now(), text: notes }];
    chrome.storage.local.set({ researchNotes: updatedNotes }, () => {
      setAllNotes(updatedNotes);
      setNotes("");
      alert(" Note saved successfully!");
    });
  };

  const deleteNote = (id) => {
    const updatedNotes = allNotes.filter((note) => note.id !== id);
    chrome.storage.local.set({ researchNotes: updatedNotes }, () => {
      setAllNotes(updatedNotes);
      alert("🗑 Note deleted successfully!");
    });
  };

  const summarizeText = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const [selection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString(),
    });

    const selectedText = selection?.result || "";
    if (!selectedText) {
      setResult(" Please select some text to summarize.");
      return;
    }

    const response = await fetch("http://localhost:8080/api/research/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: selectedText, operation: "summarize" }),
    });

    if (!response.ok) {
      setResult(` API Error: ${response.status}`);
      return;
    }

    const text = await response.text();
    setResult(text.replace(/\n/g, "<br>"));
  };

  //suggest section
  const suggestText = async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const [selection] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => window.getSelection().toString(),
    });

    const selectedText = selection?.result || "";
    if (!selectedText) {
      setResult("Please select some text to get suggestions.");
      return;
    }

    const response = await fetch("http://localhost:8080/api/research/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: selectedText, operation: "suggest" }),
    });

    if (!response.ok) {
      setResult(`API Error: ${response.status}`);
      return;
    }

    const text = await response.text();
    setResult(text.replace(/\n/g, "<br>"));
  };

  return (
    <div className="p-4 w-[350px] bg-[#fdf6e3] min-h-screen font-[Poppins] transition-colors">
      {/* Header */}
      <header className="border-b border-gray-200 pb-3 mb-4">
        <h2 className="text-2xl font-bold text-blue-700">Research Assistant</h2>
      </header>

      {/* Actions */}
      <div className="flex gap-3 mb-4">
        <button
          onClick={summarizeText}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg shadow-md transition transform hover:scale-105"
        >
          Summarize
        </button>
        <button
          onClick={suggestText}
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 rounded-lg shadow-md transition transform hover:scale-105"
        >
          Suggest
        </button>
      </div>

      {/* Notes Section */}
      <div className="bg-white p-4 rounded-xl shadow-md mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Research Notes
        </h3>
        <textarea
          className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          rows={3}
          placeholder="Take notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={saveNotes}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg shadow-md transition transform hover:scale-105"
          >
            Save Note
          </button>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg shadow-md transition transform hover:scale-105"
          >
            {showNotes ? "Hide Notes" : "View Notes"}
          </button>
        </div>

        {showNotes && (
          <div className="mt-3 max-h-40 overflow-y-auto border-t border-gray-200 pt-2">
            {allNotes.length > 0 ? (
              allNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex justify-between items-center border-t border-gray-200 bg-gray-50 p-2 mb-2 rounded-lg shadow-sm transition hover:bg-gray-100"
                >
                  <p className="text-sm text-gray-700 flex-1">{note.text}</p>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="ml-2 text-red-500 hover:text-red-700 transition transform hover:scale-125"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No saved notes.</p>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Results</h3>
        <div
          className="text-sm text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: result || "<p>No results yet.</p>",
          }}
        />
      </div>
    </div>
  );
}
