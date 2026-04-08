// Test parsing JSON with literal \\n outside strings
try {
  let s = "{\\n  \"key\": \"value\\nvalue2\"\\n}";
  console.log("String is:", s);
  JSON.parse(s);
  console.log("Parsed OK!");
} catch(e) {
  console.error("Parse failed:", e.message);
}
