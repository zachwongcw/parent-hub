const str = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
console.log("String length:", str?.length);
try {
  JSON.parse(str);
  console.log("Parse OK");
} catch (e) {
  console.error(e.message);
  console.log("Char at 180:", str.charAt(180));
  console.log("Char at 181:", str.charAt(181));
  console.log("Char at 182:", str.charAt(182));
  console.log("Char code at 181:", str.charCodeAt(181));
}
