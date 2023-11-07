const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server);

const fs = require("fs");
const crypto = require("crypto");
const Path = require("path");
const request = require("request");

const hmac_key = process.env.HMAC_KEY;
const API_KEY = process.env.API_KEY;

// empty signature (all zeros). HS256 gives 32 byte signature, and we encode in hex, so we need 64 characters here
let emptySignature = Array(64).fill("0").join("");

const rawDataBuffer = [];
let isSendingRawData = false;
async function sendDataToEdgeImpulse(rawData, sendImmediately = true) {
  if (sendImmediately) {
    _sendDataToEdgeImpulse(rawData);
    return;
  }
  
  rawDataBuffer.push(rawData);
  if (isSendingRawData) {
    return;
  }

  isSendingRawData = true;
  do {
    await _sendDataToEdgeImpulse(rawDataBuffer.shift());
  } while (rawDataBuffer.length);
  isSendingRawData = false;
}

async function _sendDataToEdgeImpulse(rawData) {
  const { pressure, weight, macAddress, type } = rawData;
  
  if (weight == null) {
    return;
  }

  const data = {
    protected: {
      ver: "v1",
      alg: "HS256",
      iat: Math.floor(Date.now() / 1000), // epoch time, seconds since 1970
    },
    signature: emptySignature,
    payload: {
      device_name: macAddress,
      device_type: "ESP32-WROOM-32E",
      interval_ms: 1,
      sensors: [
        {
          name: "pressure_sensor",
          units: "pressure",
        },
      ],
      values: pressure.map((value) => [value]),
    },
  };

  let encoded = JSON.stringify(data);

  // now calculate the HMAC and fill in the signature
  let hmac = crypto.createHmac("sha256", hmac_key);
  hmac.update(encoded);
  let signature = hmac.digest().toString("hex");

  // update the signature in the message and re-encode
  data.signature = signature;
  encoded = JSON.stringify(data);

  // now upload the buffer to Edge Impulse
  return new Promise((resolve, reject) => {
    request.post(
    `https://ingestion.edgeimpulse.com/api/${type}/data`,
    {
      headers: {
        "x-api-key": API_KEY,
        "x-file-name": weight,
        "Content-Type": "application/json",
      },
      body: encoded,
      encoding: "binary",
    },
    function (err, response, body) {
      if (err) {
        console.error("Request failed", err);
        reject(err);
      }

      console.log("Uploaded file to Edge Impulse", response.statusCode, body);
      resolve(response, body);
    }
  );
  })
}

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("data", (rawData) => {
    sendDataToEdgeImpulse(rawData, true);
  });
});

server.listen(8080, () => {
  console.log("listening on *:8080");
});
