import { Storage } from "@google-cloud/storage";

let storage = null;

function getStorage() {
  if (!storage) {
    try {
      // Try to use service account key file if available
      if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
      } else {
        // Use service account key from environment variable
        const credentials = JSON.parse(process.env.GOOGLE_CLOUD_KEY || "{}");
        storage = new Storage({
          projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
          credentials,
        });
      }
    } catch (error) {
      console.error("Failed to initialize Google Cloud Storage:", error);
      throw new Error("Cloud storage initialization failed");
    }
  }
  return storage;
}

export async function uploadToCloudStorage(buffer, fileName, mimeType) {
  try {
    const storage = getStorage();
    const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

    // Generate unique filename
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const file = bucket.file(uniqueFileName);

    const stream = file.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
      public: true,
      validation: "md5",
    });

    return new Promise((resolve, reject) => {
      stream.on("error", (error) => {
        console.error("Upload stream error:", error);
        reject(error);
      });

      stream.on("finish", async () => {
        try {
          // Make the file publicly readable
          await file.makePublic();

          const publicUrl = `https://storage.googleapis.com/${process.env.GOOGLE_CLOUD_BUCKET_NAME}/${uniqueFileName}`;

          resolve({
            url: publicUrl,
            fileName: uniqueFileName,
            originalName: fileName,
            size: buffer.length,
            mimeType,
          });
        } catch (error) {
          console.error("Error making file public:", error);
          reject(error);
        }
      });

      stream.end(buffer);
    });
  } catch (error) {
    console.error("Upload to cloud storage failed:", error);
    throw error;
  }
}

export async function deleteFromCloudStorage(fileName) {
  try {
    const storage = getStorage();
    const bucket = storage.bucket(process.env.GOOGLE_CLOUD_BUCKET_NAME);

    await bucket.file(fileName).delete();
    return true;
  } catch (error) {
    console.error("Delete from cloud storage failed:", error);
    return false;
  }
}
