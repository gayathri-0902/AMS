const mammoth = require("mammoth");
const path = require("path");

async function readWordFile() {
  try {
    const filePath = path.join(__dirname, "sample.docx");

    const result = await mammoth.extractRawText({ path: filePath });

    console.log("📄 Extracted Text:\n");
    console.log(result.value); // The raw text
  } catch (error) {
    console.error("❌ Error reading Word file:", error);
  }
}

readWordFile();
