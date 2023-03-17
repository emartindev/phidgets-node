// Require the needed modules for the app to work
const net = require("net");
const express = require("express");
const cors = require("cors");
const phidget22 = require("phidget22");

// Create an instance of Express and set a port number for the server
const app = express();
const port = 8080;

const DISTANCE_THRESHOLD = 100; // cm

let inTriggered = false;
let outTriggered = false;

// Initialize a variable called "COMMAND" with a value of null
let COMMAND = null;

// An object containing data about the trigger event used for communication
// via TCP client
const triggerData = {
  type: COMMAND, // specifies which command is triggered (null when not triggered)
  count: 0, // counts the number of triggers sent
  tcpClient: {
    // settings for connecting to the TCP client
    addr: "127.0.0.1",
    port: 8744,
  },
  timestamp: null, // stores the time of request triggering
};

let sensorData = {
    hubName: null,
  hubSerialNumber: null,
  howManyPorts: null,
};

const runExplorer = async () => {
  const conn = new phidget22.NetworkConnection(5661, "localhost");
  await conn.connect();

  const vintHub = new phidget22.Hub();
  await vintHub.open(5000);
  const hubSerialNumber = vintHub.getDeviceSerialNumber();
  sensorData.hubSerialNumber = hubSerialNumber;
  console.log(`Hub Serial Number: ${hubSerialNumber}`);
  // console.log(`Hub Port 1: ${vintHub.getHubPort(0)}`);
  // get information about the ports occupied by the sensors
    const portCount = vintHub.getHubPortCount();
    sensorData.howManyPorts = portCount;
    console.log(`Ports Occupied: ${portCount}`);
    
    // get information about the sensors connected to the ports
    // get the name of the sensor connected to the port
    const hubName = vintHub.getDeviceName(0);
    sensorData.hubName = hubName;
    console.log(`Sensor Name: ${hubName}`);






  
};

// Create a new TCP server and pass a callback function that executes when a
// connection is made by the client
const server = net.createServer((socket) => {
  console.log("TCP client connected");

  // listen for incoming data and update the triggerData object whenever you receive it.
  socket.on("data", (data) => {
    triggerData.count++;
    triggerData.type = data.toString().trim(); // set obtained data as directive thus receiving TRIGGER will switch it to "triggered"
    triggerData.timestamp = new Date().toISOString(); // log established and updated date and time
    console.log(`Data received from TCP client: ${data}`);

    // if the trigger type equals 'TRIGGER' , execute code inside setTimeout function after 10 seconds
    if (triggerData.type === "TRIGGER") {
      setTimeout(() => {
        COMMAND = "NOT_TRIGGERED"; // set command to not triggered
        triggerData.type = COMMAND;
        triggerData.timestamp = new Date().toISOString();
        console.log(
          `Command set to ${COMMAND} after 10 seconds of receiving TRIGGER`
        );
      }, 20000);
    }
  });

  socket.on("close", () => {
    console.log("TCP client disconnected");
  });

  socket.on("error", (err) => {
    console.error(`Error: ${err}`);
  });
});

// Start listening on the specified port in the tcpClient port field.
server.listen(triggerData.tcpClient.port, () => {
  console.log(`TCP Server listening on port ${triggerData.tcpClient.port}...`);
});

// Use CORS with the Express() instance
app.use(cors());

// Set up a default endpoint route, simply responding with the triggerData Object
app.get("/trigger-data", (req, res) => {
  res.send(triggerData);
});

app.get("/sensor-data", (req, res) => {
  res.send(sensorData);
});

// Start listening on the local server port.
app.listen(port, () => console.log(`Server listening on port ${port}!`));
runExplorer();
