import { NextResponse } from "next/server";
import { deleteAllExamSubmissions, getExamSubmissions } from "../../../lib/database";
import { deleteAllExamineeFolders } from "../../../lib/file-storage";


export async function GET() {
  try {
    const submissions = getExamSubmissions()
    return NextResponse.json({ submissions })
  } catch (error) {
    console.error("Error fetching exam submissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    deleteAllExamSubmissions();
    deleteAllExamineeFolders();
    return NextResponse.json({ success: true, message: "All submissions deleted successfully" });
  } catch (error) {
    console.error("Error deleting all submissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}