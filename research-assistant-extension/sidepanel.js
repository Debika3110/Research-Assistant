document.addEventListener('DOMContentLoaded',()=>{
    chrome.storage.local.get(['researchNotes'],function(result){
        if(result.researchNotes){
            document.getElementById('notes').value=result.researchNotes;
        }
        
    });
    document.getElementById('summarizeBtn').addEventListener('click',summarizeText);
     document.getElementById('saveNoteBtn').addEventListener('click',saveNotes);
});

async function summarizeText() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        const selectedText = result && result[0] ? result[0].result : '';
        if (!selectedText) {
            showResult("Please select some text to summarize");
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // ✅ corrected
            },
            body: JSON.stringify({
                content: selectedText, // ✅ send actual text
                operation: 'summarize'
            })
        });

        if (!response.ok) {
            throw new Error(`API ERROR: ${response.statusText}`);
        }

        const text = await response.text();
        showResult(text.replace(/\n/g, '<br>'));

    } catch (error) {
        showResult('Error: ' + error.message);
    }
}

async function saveNotes(){
    const notes =document.getElementById('notes').value;
    chrome.storage.local.set({'researchNotes': notes},function(){
        alert('Notes saved successfully!');
    })
}

function showResult(content){
    document.getElementById('results').innerHTML=`<div class="result-items"><div class="result-content">${content}</div></div>`;
}

