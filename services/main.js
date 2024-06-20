// /* esm */
import express from "express";
import ServerlessHttp from "serverless-http";
const app = express();
import { NotFound } from "../libs/error.js";
app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});

app.use((req, res, next) => {
  throw new NotFound("Path not found.");
});

const handler = ServerlessHttp(app);
export { handler };

/* commonJS */
// const serverless = require("serverless-http");
// const express = require("express");
// const app = express();

// app.get("/", (req, res, next) => {
//   return res.status(200).json({
//     message: "Hello from root!",
//   });
// });

// app.get("/hello", (req, res, next) => {
//   return res.status(200).json({
//     message: "Hello from path!",
//   });
// });

// app.use((req, res, next) => {
//   return res.status(404).json({
//     error: "Not Found",
//   });
// });

// module.exports.handler = serverless(app);
