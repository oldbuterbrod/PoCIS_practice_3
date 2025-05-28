const net = require('net');
const fs = require('fs');
const path = require('path');

const PORT = 5000;
const SAVE_DIR = path.join(__dirname, 'uploads');
const ANALYSIS_FILE = path.join(__dirname, 'analysis_result.txt');


if (!fs.existsSync(SAVE_DIR)) {
  fs.mkdirSync(SAVE_DIR);
}


function analyzeText(text) {
  const lines = text.split(/\r?\n/);
  const lineCount = lines.length;
  let wordCount = 0;
  let charCount = text.length;

  lines.forEach(line => {
    wordCount += line.trim().split(/\s+/).filter(Boolean).length;
  });

  return { lineCount, wordCount, charCount };
}


const server = net.createServer((socket) => {
  console.log('Client connected');

  let fileName = '';
  let fileSize = 0;
  let receivedBytes = 0;
  let chunks = [];


  socket.once('data', (data) => {
    try {
      const meta = JSON.parse(data.toString());
      fileName = meta.fileName;
      fileSize = meta.fileSize;

      console.log(`Receiving file: ${fileName} (${fileSize} bytes)`);

     
      const uniqueName = Date.now() + '-' + fileName;
      const filePath = path.join(SAVE_DIR, uniqueName);

      
      socket.on('data', (chunk) => {
        chunks.push(chunk);
        receivedBytes += chunk.length;

        if (receivedBytes >= fileSize) {
          const fileBuffer = Buffer.concat(chunks);
          fs.writeFileSync(filePath, fileBuffer);
          console.log(`File saved: ${filePath}`);

          const text = fileBuffer.toString();
          const analysis = analyzeText(text);

          const resultLine = `Имя файла: ${fileName}\nСтрок: ${analysis.lineCount}, Слов: ${analysis.wordCount}, Символов: ${analysis.charCount}\n\n`;
          fs.appendFileSync(ANALYSIS_FILE, resultLine);

          socket.write(resultLine, () => {
            socket.end();
          });
        }
      });
    } catch (err) {
      console.error('Ошибка обработки метаданных:', err);
      socket.end('Ошибка: неверный формат данных\n');
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });

  socket.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
