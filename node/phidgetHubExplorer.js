// Require the needed modules for the app to work
const net = require("net");
const express = require("express");
const cors = require("cors");
const phidget22 = require("phidget22");

// Create an instance of Express and set a port number for the server
const app = express();
const port = 8081;


async function main() {
    
    let sensorData = {
        hubName: null,
        hubSerialNumber: null,
        howManyPorts: null,
      };
      
var conn = new phidget22.NetworkConnection({
	hostname: "localhost",
	port: 5661,
	name: "Phidget Server Connection",
	passwd: "",
	onAuthenticationNeeded: function() { return "password"; },
	onError: function(code, msg) { console.error("Connection Error:", msg); },
	onConnect: function() { console.log("Connected"); },
	onDisconnect: function() { console.log("Disconnected"); }
});

const vintHub = new phidget22.Hub();
   vintHub.open(5000);

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
    
    conn.connect().catch(function(err) {
        console.error("Error during connect:", err);
    });

}


// Use CORS with the Express() instance
app.use(cors());

app.get("/sensor-data", (req, res) => {
  res.send(sensorData);
});

// Start listening on the local server port.
app.listen(port, () => console.log(`Server listening on port ${port}!`));

main();
