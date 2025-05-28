# Программирование корпоративных индустриальных систем. Практика 3. Сидоров Максим Максимович ЭФМО-02-24
## Описание
Необходимо разработать сетевое приложение, которое реализует клиент-серверную архитектуру. Сервер принимает текстовые файлы от клиентов, анализирует их содержимое (количество слов, символов и строк), сохраняет результаты анализа в локальную файловую систему и отправляет ответ клиенту
## Реализуемые задачи
1.	Разработка серверной части:
Создать сервер на основе библиотеки .Net Core 8-9.
Реализовать возможность получения текстовых файлов от нескольких клиентов одновременно.
Сохранить файлы в локальной файловой системе с уникальными именами.
2.	Анализ содержимого файлов:
Реализовать подсчет количества строк, слов и символов в каждом полученном файле.
Сохранить результаты анализа в текстовый файл (например, analysis_result.txt).
3.	Отправка результатов клиенту:
Сервер отправляет клиенту анализ содержимого файлов в формате: 
Имя файла: file1.txt  
Строк: 10, Слов: 50, Символов: 300  
4.	Разработка клиентской части:
Клиент подключается к серверу, отправляет текстовые файлы, получает и отображает результаты анализа.
5.	Обработка ошибок:
Сервер должен корректно обрабатывать недоступность файлов, некорректные запросы или другие возможные ошибки.

## Пример вывода:
Результаты анализа:
1.	Клиент отправляет серверу файл file1.txt.
2.	Сервер сохраняет файл, анализирует его содержимое и отправляет ответ клиенту.
3.	Клиент отображает результаты анализа: 
4.	Имя файла: file1.txt  
5.	Строк: 15, Слов: 100, Символов: 600  


Итог: 415 слов, 2670 символов.
## Код программы
Программа реализована на языке Node.JS. Для ее запуска необходимо октрыть два терминала. В первом терминале ввести команду «node server.js» для запуска сервера, затем во втором терминале ввести команду «node client.js <путь к файлов».
Клиент (client.js) отправляет выбранный текстовый файл на сервер, а сервер (server.js) принимает файл, сохраняет его, проводит анализ содержимого и возвращает клиенту статистику по количеству строк, слов и символов. Клиент открывает указанный файл, читает его содержимое в буфер и устанавливает соединение с сервером. Сначала он отправляет JSON с метаданными файла: имя и размер. Через короткую паузу (100 мс) отправляется сам файл. Сервер слушает соединения на порту 5000. При подключении клиента он принимает сначала метаданные, затем — сам файл. Когда файл полностью получен, сервер сохраняет его в папку uploads с уникальным именем (добавляет текущую метку времени), затем анализирует текст: считает количество строк, слов и символов. Результат записывается в файл analysis_result.txt, а также отправляется клиенту как текстовый ответ.

server.js

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

client.js

            const net = require('net');
            const fs = require('fs');
            const path = require('path');
            
            const SERVER_HOST = '127.0.0.1';
            const SERVER_PORT = 5000;
            
            const filePath = path.resolve(process.argv[2] || 'file1.txt');
            
            if (!fs.existsSync(filePath)) {
              console.error('Файл не найден:', filePath);
              process.exit(1);
            }
            
            const fileName = path.basename(filePath);
            const fileBuffer = fs.readFileSync(filePath);
            const fileSize = fileBuffer.length;
            
            const client = net.createConnection({ host: SERVER_HOST, port: SERVER_PORT }, () => {
              console.log('Connected to server');
            
              const meta = JSON.stringify({ fileName, fileSize });
              client.write(meta);
            
              setTimeout(() => {
                client.write(fileBuffer);
              }, 100);
            });
            
            client.on('data', (data) => {
              console.log('Ответ сервера:\n' + data.toString());
              client.end();
            });
            
            client.on('error', (err) => {
              console.error('Ошибка клиента:', err);
            });
            
            client.on('end', () => {
              console.log('Disconnected from server');
            });
                        })();


## Пример работы програмы

    >>node .\server.js
    Server listening on port 5000

    >> node .\client.js                                
    Connected to server
    Ответ сервера:
    Имя файла: file1.txt
    Строк: 3, Слов: 32, Символов: 227

