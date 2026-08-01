var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY process variable is missing.");
    }
    return new import_genai.GoogleGenAI({ apiKey });
  };
  app.post("/api/ai-explain", async (req, res) => {
    try {
      const { text, tenseContext } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Text prompt is required." });
      }
      const ai = getAI();
      const prompt = `Jsi expert na v\xFDuku anglick\xE9 gramatiky a \u010Das\u016F pro \u010Desk\xE9 studenty.
Anal\xFDza v\u011Bty: "${text}"
${tenseContext ? `Zam\u011B\u0159en\xED na \u010Das: ${tenseContext}` : ""}

Pros\xEDm poskytni strukturovanou odpov\u011B\u010F v jazyce \u010De\u0161tina ve form\xE1tu JSON obsahuj\xEDc\xED n\xE1sleduj\xEDc\xED pole:
{
  "tenseName": "N\xE1zev mluvnick\xE9ho \u010Dasu anglicky i \u010Desky",
  "explanation": "Jasn\xE9 a srozumiteln\xE9 vysv\u011Btlen\xED, pro\u010D se pou\u017E\xEDv\xE1 tento \u010Das",
  "formula": "Gramatick\xFD vzorec (+, -, ?)",
  "signalWords": ["seznam typick\xFDch signaliza\u010Dn\xEDch slov"],
  "examples": [
    { "en": "Anglick\xE1 kladn\xE1 v\u011Bta", "cz": "\u010Cesk\xFD p\u0159eklad" },
    { "en": "Anglick\xE1 z\xE1porn\xE1 v\u011Bta", "cz": "\u010Cesk\xFD p\u0159eklad" },
    { "en": "Anglick\xE1 ot\xE1zka", "cz": "\u010Cesk\xFD p\u0159eklad" }
  ],
  "commonMistakes": "\u010Cast\xE9 chyby \u010Desk\xFDch mluv\u010D\xEDch u tohoto \u010Dasu"
}`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const responseText = response.text || "{}";
      const data = JSON.parse(responseText);
      return res.json(data);
    } catch (error) {
      console.error("Error in /api/ai-explain:", error);
      return res.status(500).json({
        error: error.message || "Nepoda\u0159ilo se vygenerovat vysv\u011Btlen\xED pomoc\xED AI."
      });
    }
  });
  app.post("/api/ai-generate-questions", async (req, res) => {
    try {
      const { category, count = 5, difficulty = "medium" } = req.body;
      const ai = getAI();
      const prompt = `Vygeneruj ${count} testov\xFDch ot\xE1zek pro v\xFDuku anglick\xFDch \u010Das\u016F zam\u011B\u0159en\xFDch na t\xE9ma: ${category || "V\u0161echny \u010Dasy"}. Obt\xED\u017Enost: ${difficulty}.
Odpov\u011Bz v\xFDhradn\u011B ve form\xE1tu JSON jako pole objekt\u016F s touto strukturou:
[
  {
    "q": "V\u011Bta s podtr\u017E\xEDtkem pro dopl\u0148ovan\xFD \u010Das, nap\u0159. 'She _______ (work) when I called.'",
    "options": ["3 nebo 4 mo\u017Enosti odpov\xEDdaj\xEDc\xED dan\xE9mu m\xEDstu, nap\u0159. 'was working', 'worked', 'is working'"],
    "answer": 0,
    "explanation": "Podrobn\xE9 \u010Desk\xE9 vysv\u011Btlen\xED, pro\u010D je spr\xE1vn\xE1 odpov\u011B\u010F index 0 a pro\u010D ostatn\xED mo\u017Enosti nesed\xED."
  }
]`;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      const responseText = response.text || "[]";
      const questions = JSON.parse(responseText);
      return res.json({ questions });
    } catch (error) {
      console.error("Error in /api/ai-generate-questions:", error);
      return res.status(500).json({
        error: error.message || "Nepoda\u0159ilo se vygenerovat ot\xE1zky."
      });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
