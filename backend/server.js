const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Simple in-memory log of panic presses
let panicCount = 0;

app.post("/panic", (req, res) => {
  panicCount += 1;

  console.log(`🚨 Apoclypse panic button pressed ${panicCount} time(s).`);

  res.json({
    status: "ok",
    panicCount,
    message: "Apoclypse signal received by backend."
  });
});

app.get("/status", (req, res) => {
  res.json({
    status: "online",
    panicCount
  });
});

app.listen(PORT, () => {
  console.log(`Apoclypse backend listening on http://localhost:${PORT}`);
});

