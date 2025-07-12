import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // konsa domain can acess your server
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" })); // form bharne pai agar data le too

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("pulic"));

app.use(cookieParser());

// app.use(cors())  to configure it

export { app };
