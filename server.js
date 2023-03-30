const express = require("express");
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const port = process.env.PORT || 5000;

app.use(express.json());  

app.use("/api", require("./routes/memo"));

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
