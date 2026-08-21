const crypto = require("crypto");

const token = '85e7e2a2a4da8f34db7799f7ca0179ac4d689326c7d134f89209408546306653'
const hashedToken = crypto.createHash("sha256").update(token).digest("hex")
console.log(hashedToken)