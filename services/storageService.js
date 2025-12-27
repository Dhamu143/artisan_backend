const imagekit = require("../config/imagekit");
const path = require("path");

// const uploadToImageKit = async (file, folder = "general", isPrivate = false) => {
//   try {
//     const cleanFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;

//     const response = await imagekit.upload({
//       file: file.buffer,
//       fileName: cleanFileName,
//       folder: folder,
//       isPrivateFile: isPrivate,
//       useUniqueFileName: true,
//          tags: [folder, file.mimetype.split("/")[1]],
//     });

//     return response;
//   } catch (error) {
//     console.error("ImageKit Upload Error:", error);
//     throw new Error("File upload failed. Please try again.");
//   }
// };
const uploadToImageKit = async (
  file,
  folder = "general",
  isPrivate = false
) => {
  try {
    const cleanFileName = `${Date.now()}-${file.originalname.replace(
      /\s+/g,
      "-"
    )}`;

    const base64File = `data:${file.mimetype};base64,${file.buffer.toString(
      "base64"
    )}`;

    const response = await imagekit.upload({
      file: base64File,
      fileName: cleanFileName,
      folder,
      isPrivateFile: false,
      useUniqueFileName: true,
      tags: [folder, file.mimetype.split("/")[1]],
    });

    return response;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new Error("File upload failed. Please try again.");
  }
};

const deleteFromImageKit = async (fileId) => {
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error("ImageKit Delete Error:", error);
    throw error;
  }
};

module.exports = { uploadToImageKit, deleteFromImageKit };
