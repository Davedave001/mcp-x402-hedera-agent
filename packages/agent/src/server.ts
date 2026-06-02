import "dotenv/config";
import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => console.log(`Agent server on :${PORT}`));
