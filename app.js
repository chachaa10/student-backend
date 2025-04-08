const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const studentRoutes = require("./routes/students");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use("/api/students", studentRoutes);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
