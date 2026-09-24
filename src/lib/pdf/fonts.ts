import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  registered = true;
  const dir = path.join(process.cwd(), "src/lib/pdf/fonts");
  Font.register({
    family: "Carlito",
    fonts: [
      { src: path.join(dir, "Carlito-Regular.ttf"), fontWeight: 400 },
      { src: path.join(dir, "Carlito-Bold.ttf"), fontWeight: 700 },
      { src: path.join(dir, "Carlito-Italic.ttf"), fontStyle: "italic", fontWeight: 400 },
      {
        src: path.join(dir, "Carlito-BoldItalic.ttf"),
        fontStyle: "italic",
        fontWeight: 700,
      },
    ],
  });
}
