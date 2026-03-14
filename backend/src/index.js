require("dotenv").config();

const express = require("express");
const corsMiddleware = require("./middleware/cors");
const { getResources } = require("./routes/resources");
const { getResourcesMeta } = require("./routes/resourcesMeta");
const { getOperatorPantries } = require("./routes/operatorPantries");
const { createReview, getReviews } = require("./routes/reviews");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(corsMiddleware);
app.use(express.json());

app.get("/api/resources", getResources);
app.get("/api/resources/meta", getResourcesMeta);
app.get("/api/operator/pantries", getOperatorPantries);

app.post("/api/reviews", createReview);
app.get("/api/reviews", getReviews);

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
