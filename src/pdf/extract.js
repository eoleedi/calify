import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export async function extractFirstPage(file) {
  let loadingTask;
  let document;
  try {
    const data = await file.arrayBuffer();
    loadingTask = pdfjsLib.getDocument({ data });
    document = await loadingTask.promise;
    const page = await document.getPage(1);
    const content = await page.getTextContent();
    const items = content.items.map((item) => ({
      text: item.str,
      x: item.transform[4],
      y: item.transform[5],
      width: item.width,
      height: item.height,
    }));

    if (!items.some(({ text }) => text.trim() !== "")) {
      throw new Error("pdf-no-text");
    }
    return items;
  } catch (error) {
    if (error instanceof Error && error.message === "pdf-no-text") {
      throw error;
    }
    throw new Error("pdf-unreadable");
  } finally {
    await document?.destroy().catch(() => {});
    await loadingTask?.destroy().catch(() => {});
  }
}
