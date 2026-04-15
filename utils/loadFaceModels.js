const faceapi = require("face-api.js");
const path = require("path");

const loadModels = async () => {
  const modelPath = path.join(__dirname, "../models/FaceApiModels");

  await faceapi.nets.tinyFaceDetector.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

  console.log("✅ FaceAPI models loaded");
};

module.exports = loadModels;