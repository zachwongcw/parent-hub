let str = `{
  "type": "service_account",
  "project_id": "abc",
  "private_key_id": "def",
  "private_key": "-----BEGIN PRIVATE KEY-----
DATA
-----END PRIVATE KEY-----
",
  "client_email": "hello"
}`;

str = str.replace(/"private_key"\s*:\s*"([^"]+)"/g, (match, p1) => {
  return `"private_key": "${p1.replace(/\r?\n/g, '\\n')}"`;
});

console.log("After better regex:");
console.log(str);

try {
  JSON.parse(str);
  console.log("Parsed!");
} catch(e) {
  console.log("Error:", e.message);
}
