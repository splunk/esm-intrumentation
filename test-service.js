/* esm */
import express from "express";
import ServerlessHttp from "serverless-http";
import { NotFound } from "./error";
const app = express();

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
  throw new NotFound("Path not found.", { req });
});

export const serviceFunc = ServerlessHttp(app);
