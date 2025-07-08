import { type NextRequest, NextResponse } from "next/server"
import { deleteSubmissionsByExamineeId, getExamineeNameById } from "@/lib/database"
import { deleteExamineeFolder } from "@/lib/file-storage"
export const dynamic = 'force-dynamic'

export async function DELETE(
    request: NextRequest,
    { params }: { params: { examineeId: string } }
) {
    try {
        const { examineeId } = params;
        if (!examineeId) {
            return NextResponse.json({ error: "Examinee ID is required" }, { status: 400 });
        }

        // Get examinee name from DB to locate the folder
        const examineeName = getExamineeNameById(examineeId);
        if (!examineeName) {
            // Even if the name isn't found, try to delete by ID, as the folder might not exist anyway
            console.warn(`Could not find name for examinee ID: ${examineeId}. Deleting DB entries only.`);
        }

        // Delete all submissions from the database for this student
        deleteSubmissionsByExamineeId(examineeId);
        console.log(`✅ Deleted all database submissions for examinee ID: ${examineeId}`);

        // If the name was found, delete the corresponding folder
        if (examineeName) {
            deleteExamineeFolder(examineeName, examineeId);
            console.log(`✅ Deleted folder for examinee: ${examineeName}_${examineeId}`);
        }

        return NextResponse.json({ success: true, message: `All data for examinee ID ${examineeId} deleted successfully.` });
    } catch (error) {
        console.error("Error deleting submissions for examinee:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}