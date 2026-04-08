let badStr = `{
  "test": 1,
  "private_key": "-----BEGIN PRIVATE KEY-----
MIIEvgIBA
DANBgkqhki
-----END PRIVATE KEY-----"
}`;

// Fix the bad string
let fixedStr = badStr.replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, (match) => {
  return match.replace(/\r?\n/g, '\\n');
});

console.log("Original:", badStr);
console.log("Fixed:", fixedStr);

try {
  let parsed = JSON.parse(fixedStr);
  console.log("Parsed successful!", parsed.private_key);
} catch(e) {
  console.error("Failed:", e.message);
}
