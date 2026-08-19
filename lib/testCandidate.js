const fs = require("fs");
const candidate = JSON.parse(fs.readFileSync("./data/candidate.json", "utf-8"));
console.log(candidate);
console.log("Skills joined:", candidate.skills.join(", "));
