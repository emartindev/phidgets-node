const express = require('express');
const net = require('net');
const cors = require('cors'); // import cors module

const app = express();
const addr = '127.0.0.1';
const port = 8744;
let i = 0;

app.use(express.json());
app.use(cors()); // use cors

app.post('/trigger-command', (req, res) => {
  console.log(`Triggering (count: ${i})...`);

  const client = new net.Socket();

  client.connect(port, addr, () => {
    console.log(`Connected to ${addr}:${port}`);
    client.write('TRIGGER\r\n');
  });

  client.on('error', (error) => {
    console.error(`Error connecting to ${addr}:${port}: ${error}`);

    res.status(500).json({ error: 'Internal server error' });
  });

  client.on('close', () => {
    console.log('Connection closed');

    res.sendStatus(200);
  });

  i++;
});

app.listen(8082, () => {
  console.log('Server listening on port 8082!');
});
