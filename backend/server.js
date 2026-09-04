const app = require("./src/app");
const env = require("./src/config/environment");

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Server running in ${env.nodeEnv} mode on http://localhost:${PORT}`);
});