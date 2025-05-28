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
