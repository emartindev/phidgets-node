// Require the needed modules for the app to work
const net = require("net");
const express = require("express");
const cors = require("cors");
const phidget22 = require("phidget22");

// Create an instance of Express and set a port number for the server
const app = express();
const port = 8081;

const DISTANCE_THRESHOLD = 100; // cm

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
  connected: false,
  distanceThreshold: DISTANCE_THRESHOLD,
  sensorInformation: {
    distanceIn: null,
    distanceOut: null,
    distanceInGate2: null,
    distanceOutGate2: null,
    hubPort1: null,
    hubPort2: null,
  },
  command: COMMAND,
};

const runExplorer = async () => {
  // const conn = new phidget22.USBConnection();
  const conn = new phidget22.NetworkConnection();
  await conn.connect();

  const vintHub = new phidget22.Hub();
  await vintHub.open(5000);
  const hubSerialNumber = vintHub.getDeviceSerialNumber();
  sensorData.hubSerialNumber = hubSerialNumber;
  console.log(`Hub Serial Number: ${hubSerialNumber}`);
  const distanceSensorIn = new phidget22.DistanceSensor();
  const distanceSensorOut = new phidget22.DistanceSensor();
  const distanceSensorInGate2 = new phidget22.DistanceSensor();
  const distanceSensorOutGate2 = new phidget22.DistanceSensor();

  // Specify the hub port for each distance sensor
  distanceSensorIn.hubPort = 0;
  distanceSensorOut.hubPort = 1;
  distanceSensorInGate2.hubPort = 3;
  distanceSensorOutGate2.hubPort = 4;


  distanceSensorIn.onDistanceChange = (distance) => {
    sensorData.sensorInformation.distanceIn = distance;
    sensorData.sensorInformation.distanceOut = distanceSensorOut.distance;
    sensorData.sensorInformation.hubPort1 = distanceSensorIn.hubPort;
    sensorData.sensorInformation.hubPort2 = distanceSensorOut.hubPort;
    sensorData.sensorInformation.hubSerialNumber = hubSerialNumber;

    process.stdout.write(`Distance In: ${distanceSensorIn.distance} & Distance Out: ${distanceSensorOut.distance} \r`);
    // console.log(`Distance In: ${distance}`);

  };

  const portCount = vintHub.getHubPortCount();
  sensorData.howManyPorts = portCount;
  console.log(`Ports Occupied: ${portCount}`);

  const hubName = vintHub.getDeviceName(0);
  sensorData.hubName = hubName;
  console.log(`Sensor Name: ${hubName}`);

  sensorData.connected = true;
  console.log(`Connected: ${sensorData.connected}`);

  await Promise.all([
    distanceSensorIn.open(5000),
    distanceSensorOut.open(5000),
    distanceSensorInGate2.open(5000),
    distanceSensorOutGate2.open(5000)
  ]);
};

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


app.use(cors());

app.get("/sensor-data", (req, res) => {
  res.send(sensorData);
});

app.get("/trigger-data", (req, res) => {
  res.send(triggerData);
});


// Start listening on the local server port.
app.listen(port, () => console.log(`Server listening on port ${port}!`));
runExplorer();
