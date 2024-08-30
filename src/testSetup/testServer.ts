import { createWriteStream, mkdirSync } from "fs";
import express from "express";
import path from "path";
import got from "got";
import { removeSync } from "fs-extra";

export const testUploadResultDirectory = "result";

export const deleteTestUploads = () => {
  const dirToDelete = path.join(__dirname, testUploadResultDirectory);
  removeSync(dirToDelete);
};

export const isServerUp = async (port: number) => {
  try {
    await got(`http://localhost:${port}/`);
    return true;
  } catch (_error) {
    return false;
  }
};

export const startTestServer = (port: number) => {
  const app = express();

  app.get("/", (_req, res) => {
    res.status(200).send("ok");
  });

  app.put("/test/upload-with-stream/**", (req, res) => {
    const pathParam = `/${Object.values(req.params)[0]}`;
    const testFilePath = path.join(__dirname, pathParam);

    // The try/catch is necessary to prevent race conditions when multiple processes try to create the same dir.
    try {
      const dir = path.dirname(testFilePath);
      mkdirSync(dir, { recursive: true });
    } catch (error) {
      if (error instanceof Error && error.message !== "EEXIST") {
        console.error(error.message);
        console.error(error.stack);
        throw error;
      }
    }

    const stream = createWriteStream(testFilePath);
    stream.on("open", () => {
      req.pipe(stream);
    });
    stream.on("finish", () => {
      console.log("Processing  ...  100%");
      res.send({ status: "success", path: testFilePath });
    });
  });

  app.put("/test/retry-upload/:status", (req, res) => {
    const status = parseInt(req.params.status);
    res.status(status).send("mock upload response");
  });

  app.get("*", (_req, res) => {
    res.status(404).send("404");
  });

  const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });

  return server;
};
