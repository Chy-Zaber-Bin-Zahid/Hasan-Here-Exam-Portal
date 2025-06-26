import { writeFileSync, readFileSync, existsSync, mkdirSync, unlinkSync, readdirSync, rmdirSync, rmSync } from "fs"
import { join, dirname } from "path"
import { randomUUID } from "crypto"

// Base storage directory
const STORAGE_DIR = join(process.cwd(), "storage")

// Ensure directories exist
function ensureDirectories() {
  if (!existsSync(STORAGE_DIR)) mkdirSync(STORAGE_DIR, { recursive: true })
}

// Create examinee folder structure: storage/name_id/
function createExamineeFolder(examineeName: string, examineeId: string): string {
  ensureDirectories()

  const examineeFolderName = `${examineeName}_${examineeId}`
  const examineeFolderPath = join(STORAGE_DIR, examineeFolderName)

  if (!existsSync(examineeFolderPath)) {
    mkdirSync(examineeFolderPath, { recursive: true })
  }

  return examineeFolderPath
}

// Create exam type folder: storage/name_id/writing|listening|reading/
function createExamTypeFolder(examineeName: string, examineeId: string, examType: string): string {
  const examineeFolderPath = createExamineeFolder(examineeName, examineeId)
  const examTypeFolderPath = join(examineeFolderPath, examType)

  if (!existsSync(examTypeFolderPath)) {
    mkdirSync(examTypeFolderPath, { recursive: true })
  }

  return examTypeFolderPath
}

// Audio file storage (for listening exams)
export function saveAudioFile(audioBlob: Buffer, originalName: string): { filename: string; path: string } {
  ensureDirectories()

  // Store audio files in a general audio directory for teachers to upload
  const audioDir = join(STORAGE_DIR, "teacher_audio_uploads")
  if (!existsSync(audioDir)) mkdirSync(audioDir, { recursive: true })

  const fileExtension = originalName.split(".").pop() || "mp3"
  const filename = `${randomUUID()}.${fileExtension}`
  const filePath = join(audioDir, filename)

  writeFileSync(filePath, audioBlob)

  return {
    filename,
    path: `/api/files/audio/${filename}`,
  }
}

export function saveImageFile(imageBuffer: Buffer, originalName: string): { filename: string; path: string } {
  ensureDirectories();
  const imageDir = join(STORAGE_DIR, "writing_images");
  if (!existsSync(imageDir)) mkdirSync(imageDir, { recursive: true });

  const fileExtension = originalName.split(".").pop() || "png";
  const filename = `${randomUUID()}.${fileExtension}`;
  const filePath = join(imageDir, filename);

  writeFileSync(filePath, imageBuffer);

  return {
    filename,
    path: `/api/files/image/${filename}`,
  };
}


export function getAudioFile(filename: string): Buffer | null {
  try {
    const audioDir = join(STORAGE_DIR, "teacher_audio_uploads")
    const filePath = join(audioDir, filename)
    if (!existsSync(filePath)) return null
    return readFileSync(filePath)
  } catch (error) {
    console.error("Error reading audio file:", error)
    return null
  }
}

export function getImageFile(filename: string): Buffer | null {
  try {
    const imageDir = join(STORAGE_DIR, "writing_images");
    const filePath = join(imageDir, filename);
    if (!existsSync(filePath)) return null;
    return readFileSync(filePath);
  } catch (error) {
    console.error("Error reading image file:", error);
    return null;
  }
}


export function deleteAudioFile(filename: string): boolean {
  try {
    const audioDir = join(STORAGE_DIR, "teacher_audio_uploads");
    const filePath = join(audioDir, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`🗑️ Deleted audio file: ${filePath}`);
      return true;
    }
    console.log(`⚠️ Audio file not found for deletion: ${filePath}`);
    return false; // File did not exist
  } catch (error) {
    console.error("❌ Error deleting audio file:", error);
    return false;
  }
}

export function deleteImageFile(filename: string): boolean {
  try {
    const imageDir = join(STORAGE_DIR, "writing_images");
    const filePath = join(imageDir, filename);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      console.log(`🗑️ Deleted image file: ${filePath}`);
      return true;
    }
    console.log(`⚠️ Image file not found for deletion: ${filePath}`);
    return false; // File did not exist
  } catch (error) {
    console.error("❌ Error deleting image file:", error);
    return false;
  }
}


// PDF file storage in examinee's exam type folder
export function savePDFFile(
  pdfBlob: Buffer,
  examType: string,
  examineeName: string,
  examineeId: string,
  examTitle: string,
): { filename: string; path: string; fullPath: string } {
  const examTypeFolderPath = createExamTypeFolder(examineeName, examineeId, examType)

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `${examTitle.replace(/[^a-zA-Z0-9]/g, "_")}_${timestamp}.pdf`
  const filePath = join(examTypeFolderPath, filename)

  writeFileSync(filePath, pdfBlob)

  return {
    filename,
    path: `/api/files/pdf/${examineeName}_${examineeId}/${examType}/${filename}`,
    fullPath: filePath,
  }
}

export function getPDFFile(
  examineeName: string,
  examineeId: string,
  examType: string,
  filename: string,
): Buffer | null {
  try {
    const examTypeFolderPath = join(STORAGE_DIR, `${examineeName}_${examineeId}`, examType)
    const filePath = join(examTypeFolderPath, filename)
    if (!existsSync(filePath)) return null
    return readFileSync(filePath)
  } catch (error) {
    console.error("Error reading PDF file:", error)
    return null
  }
}

export function deleteSubmissionAndCleanUp(pdfPath: string): boolean {
  try {
    const fullPath = join(process.cwd(), pdfPath);

    if (existsSync(fullPath)) {
      unlinkSync(fullPath);
      console.log(`🗑️ Deleted submission PDF: ${fullPath}`);

      const examTypeDir = dirname(fullPath);
      if (readdirSync(examTypeDir).length === 0) {
        rmdirSync(examTypeDir);
        console.log(`🗑️ Deleted empty exam type directory: ${examTypeDir}`);

        const examineeDir = dirname(examTypeDir);
        if (readdirSync(examineeDir).length === 0) {
          rmdirSync(examineeDir);
          console.log(`🗑️ Deleted empty examinee directory: ${examineeDir}`);
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error deleting submission and cleaning up:", error);
    return false;
  }
}

// List examinee folders
export function listExamineeFolders(): string[] {
  ensureDirectories()
  try {
    const fs = require("fs")
    const teacherAssetFolders = ["teacher_audio_uploads", "writing_images"]; // Define folders to exclude
    return fs.readdirSync(STORAGE_DIR).filter((item: string) => {
      const itemPath = join(STORAGE_DIR, item)
      // Ensure it's a directory and NOT one of the protected teacher asset folders.
      return fs.statSync(itemPath).isDirectory() && !teacherAssetFolders.includes(item)
    })
  } catch (error) {
    console.error("Error listing examinee folders:", error);
    return []
  }
}

export function deleteAllExamineeFolders(): boolean {
    ensureDirectories();
    try {
        const examineeFolders = listExamineeFolders();
        for (const folder of examineeFolders) {
            const folderPath = join(STORAGE_DIR, folder);
            rmSync(folderPath, { recursive: true, force: true });
            console.log(`🗑️ Deleted examinee folder: ${folderPath}`);
        }
        return true;
    } catch (error) {
        console.error("❌ Error deleting all examinee folders:", error);
        return false;
    }
}

export function deleteExamineeFolder(examineeName: string, examineeId: string): boolean {
    ensureDirectories();
    try {
        const folderName = `${examineeName}_${examineeId}`;
        const folderPath = join(STORAGE_DIR, folderName);
        if (existsSync(folderPath)) {
            rmSync(folderPath, { recursive: true, force: true });
            console.log(`🗑️ Deleted examinee folder: ${folderPath}`);
            return true;
        }
        console.log(`⚠️ Examinee folder not found for deletion: ${folderPath}`);
        return false; // Folder did not exist
    } catch (error) {
        console.error(`❌ Error deleting examinee folder for ${examineeName}_${examineeId}:`, error);
        return false;
    }
}


// List exam submissions for an examinee
export function listExamineeSubmissions(
  examineeName: string,
  examineeId: string,
): {
  writing: string[]
  listening: string[]
  reading: string[]
} {
  const examineeFolderPath = join(STORAGE_DIR, `${examineeName}_${examineeId}`)

  const result = {
    writing: [],
    listening: [],
    reading: [],
  }

  if (!existsSync(examineeFolderPath)) return result

  try {
    const fs = require("fs")

    const examTypes = ["writing", "listening", "reading"] as const

    for (const examType of examTypes) {
      const examTypePath = join(examineeFolderPath, examType)
      if (existsSync(examTypePath)) {
        result[examType] = fs.readdirSync(examTypePath).filter((file: string) => file.endsWith(".pdf"))
      }
    }

    return result
  } catch (error) {
    console.error("Error listing examinee submissions:", error)
    return result
  }
}

// Create active exam marker (to track ongoing exams)
export function createActiveExamMarker(
  examineeName: string,
  examineeId: string,
  examType: string,
  examData: any,
): void {
  const examTypeFolderPath = createExamTypeFolder(examineeName, examineeId, examType)
  const markerPath = join(examTypeFolderPath, "active_exam.json")

  const markerData = {
    examType,
    examData,
    startTime: new Date().toISOString(),
    status: "in_progress",
  }

  writeFileSync(markerPath, JSON.stringify(markerData, null, 2))
}

// Remove active exam marker (when exam is completed)
export function removeActiveExamMarker(examineeName: string, examineeId: string, examType: string): void {
  const examTypeFolderPath = join(STORAGE_DIR, `${examineeName}_${examineeId}`, examType)
  const markerPath = join(examTypeFolderPath, "active_exam.json")

  if (existsSync(markerPath)) {
    const fs = require("fs")
    fs.unlinkSync(markerPath)
  }
}