import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/tracks/:id/books → units → unitExams
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const trackId = params.id;
  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });

  const books = await prisma.book.findMany({
    where: { trackId },
    orderBy: { createdAt: "asc" },
    include: {
      units: {
        orderBy: { order: "asc" },
        include: {
          unitExams: {
            include: {
              exam: {
                select: { id: true, title: true, examType: true, isActive: true }
              }
            }
          }
        }
      }
    }
  });

  return NextResponse.json({ track, books });
}


