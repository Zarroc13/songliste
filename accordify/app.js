// Akkord-Zeilen erkennen (bestehend nur aus Chords und Leerzeichen)
function isChordLine(line, chordNames) {
  const words = line.trim().split(/\s+/);
  if (!line.trim()) return false;
  let chordCount = 0;
  for (const word of words) {
    if (
      chordNames.has(word.replace(/\*+$/, "")) || // "Em**", "Am*" -> "Em", "Am"
      /^[A-G][#b]?([a-zA-Z0-9]*)?(\/[A-G][#b]?)?$/.test(word.replace(/\*+$/, ""))
    ) {
      chordCount++;
    }
  }
  return chordCount > 0 && chordCount * 2 >= words.length; // mind. 50% Chords
}

// Chord-Namen aus dem [Chords]-Block extrahieren
function extractChordNames(lines) {
  const chordNames = new Set();
  let inChordsBlock = false;
  for (const line of lines) {
    if (line.trim().toLowerCase() === "[chords]") {
      inChordsBlock = true;
      continue;
    }
    if (inChordsBlock) {
      if (line.trim().startsWith("[")) break;
      const match = line.match(/^([A-G][#b]?[\w\d\/]*)/);
      if (match) {
        chordNames.add(match[1]);
      }
    }
  }
  return chordNames;
}

// Hauptfunktion: Akkorde in Text einfügen
function formatChords(text) {
  const lines = text.split(/\r?\n/);
  const chordNames = extractChordNames(lines);

  let output = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Akkordzeile erkennen
    if (isChordLine(line, chordNames)) {
      // Nächste Zeile ist hoffentlich die Gesangszeile
      const chordLine = line;
      let lyricLine = lines[i + 1] || "";
      // Positionen der Akkorde ermitteln
      let chordPos = [];
      // Chords mit Position in der Zeile merken (Akkordzeile ist meist mit Leerstellen ausgefüllt)
      for (let j = 0; j < chordLine.length; j++) {
        if (chordLine[j] !== " " && (j === 0 || chordLine[j - 1] === " ")) {
          // Akkord fängt hier an
          let k = j;
          while (k < chordLine.length && chordLine[k] !== " ") k++;
          let chord = chordLine.slice(j, k).trim();
          chord = chord.replace(/\*+$/, ""); // Em**, Am* => Em, Am
          if (chord) chordPos.push({ chord, pos: j });
        }
      }
      // Akkorde an Positionen in Lyriczeile einfügen
      let offset = 0;
      for (const { chord, pos } of chordPos) {
        const insertAt = Math.min(pos + offset, lyricLine.length);
        lyricLine = lyricLine.slice(0, insertAt) + "[" + chord + "]" + lyricLine.slice(insertAt);
        offset += chord.length + 2; // wegen []
      }
      output.push(lyricLine);
      i += 2; // nächste Zeile(n)
    } else {
      output.push(line);
      i++;
    }
  }
  return output.join('\n');
}

// UI-Logik
document.getElementById("convertBtn").onclick = function () {
  const input = document.getElementById("input").value;
  const formatted = formatChords(input);
  document.getElementById("output").textContent = formatted;
  document.getElementById("downloadBtn").disabled = false;
};

document.getElementById("downloadBtn").onclick = function () {
  const formatted = document.getElementById("output").textContent;
  const blob = new Blob([formatted], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "song_mit_akkorden.txt";
  a.click();
  URL.revokeObjectURL(url);
};
