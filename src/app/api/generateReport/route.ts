// GET /api/generateReport?range=daily|weekly
// Generates a PDF report with the user's data using pdfkit.
// Includes: user name, date range, daily calorie summaries, macro breakdowns,
// weight trend, water intake, workout history.
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureActiveUser } from "@/lib/auth";
import { parseMacros } from "@/lib/json";
import PDFDocument from "pdfkit";

export const runtime = "nodejs";

const COLORS = {
  primary: "#f97316", // streak orange
  protein: "#ef4444",
  carbs: "#f59e0b",
  fats: "#3b82f6",
  water: "#06b6d4",
  text: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  bg: "#f8fafc",
};

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function faNum(n: number | null | undefined): string {
  if (n == null) return "—";
  return String(Math.round(n));
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") ?? "weekly") as "daily" | "weekly";
    const userId = await ensureActiveUser().then((u) => u.id);

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const today = new Date();
    const todayKey = fmtDate(today);
    const startDay = new Date(today);
    if (range === "weekly") {
      startDay.setDate(startDay.getDate() - 6);
    }
    startDay.setHours(0, 0, 0, 0);
    const startKey = fmtDate(startDay);

    // Logs in the range
    const logs = await db.log.findMany({
      where: {
        userId,
        timestamp: { gte: startDay, lte: today },
      },
      orderBy: { timestamp: "asc" },
    });

    // Health daily in the range
    const health = await db.healthDaily.findMany({
      where: { userId, date: { gte: startKey, lte: todayKey } },
      orderBy: { date: "asc" },
    });

    // Group logs by date
    const byDate = new Map<string, { calories: number; protein: number; carbs: number; fat: number; water: number; burned: number; workouts: number }>();
    for (const log of logs) {
      const dayKey = log.timestamp.toISOString().slice(0, 10);
      const entry = byDate.get(dayKey) ?? { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, burned: 0, workouts: 0 };
      if (log.type === "meal" && log.macros) {
        const m = parseMacros(log.macros);
        entry.calories += m.calories;
        entry.protein += m.protein;
        entry.carbs += m.carbs;
        entry.fat += m.fat;
      } else if (log.type === "water") {
        entry.water += log.waterMl ?? 0;
      } else if (log.type === "workout" && log.workoutSummary) {
        const w = JSON.parse(log.workoutSummary);
        entry.burned += w.caloriesBurned ?? 0;
        entry.workouts += 1;
      }
      byDate.set(dayKey, entry);
    }

    // Compile list of days
    const days: Array<{ date: string; calories: number; protein: number; carbs: number; fat: number; water: number; burned: number; workouts: number; weight: number | null; steps: number }> = [];
    const totalDays = range === "weekly" ? 7 : 1;
    for (let i = totalDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = fmtDate(d);
      const e = byDate.get(key);
      const h = health.find((hd) => hd.date === key);
      days.push({
        date: key,
        calories: e?.calories ?? 0,
        protein: e?.protein ?? 0,
        carbs: e?.carbs ?? 0,
        fat: e?.fat ?? 0,
        water: e?.water ?? 0,
        burned: e?.burned ?? 0,
        workouts: e?.workouts ?? 0,
        weight: h?.weightKg ?? null,
        steps: h?.steps ?? 0,
      });
    }

    // Workouts list (most recent first)
    const workouts = logs
      .filter((l) => l.type === "workout" && l.workoutSummary)
      .map((l) => ({
        date: l.timestamp.toISOString().slice(0, 10),
        ...(JSON.parse(l.workoutSummary!) as Record<string, unknown>),
      }))
      .reverse()
      .slice(0, 20);

    // Build goals
    const goals = parseMacros(user.goals);

    // Sums
    const total = days.reduce(
      (acc, d) => ({
        calories: acc.calories + d.calories,
        protein: acc.protein + d.protein,
        carbs: acc.carbs + d.carbs,
        fat: acc.fat + d.fat,
        water: acc.water + d.water,
        burned: acc.burned + d.burned,
        workouts: acc.workouts + d.workouts,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, burned: 0, workouts: 0 }
    );
    const avgCalories = days.length > 0 ? Math.round(total.calories / days.length) : 0;

    // --- Build PDF ---
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));

    // Header
    doc.fontSize(24).fillColor(COLORS.text).font("Helvetica-Bold").text("DS-Cali Report", { align: "left" });
    doc.moveDown(0.2);
    doc.fontSize(11).fillColor(COLORS.muted).font("Helvetica").text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Range: ${startKey} -> ${todayKey}  (${range})`);
    doc.text(`User: ${user.displayName ?? "User"} <${user.email}>`);
    doc.moveDown(0.5);

    // Divider
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.5);

    // Summary card
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text("Summary");
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor(COLORS.muted).font("Helvetica");
    doc.text(`Avg daily calories: ${avgCalories} kcal (goal: ${goals.calories} kcal)`);
    doc.text(`Total protein: ${Math.round(total.protein)}g | carbs: ${Math.round(total.carbs)}g | fat: ${Math.round(total.fat)}g`);
    doc.text(`Total water: ${Math.round(total.water / 1000 * 10) / 10} L`);
    doc.text(`Total workouts: ${total.workouts} | Calories burned: ${Math.round(total.burned)} kcal`);
    doc.moveDown(0.7);

    // Daily summaries table
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text("Daily Calorie Summaries");
    doc.moveDown(0.4);

    // Table header
    const tableTop = doc.y;
    const cols = [
      { name: "Date", x: 50, w: 90 },
      { name: "Cal", x: 140, w: 60 },
      { name: "Protein", x: 200, w: 65 },
      { name: "Carbs", x: 265, w: 60 },
      { name: "Fat", x: 325, w: 60 },
      { name: "Water(ml)", x: 385, w: 70 },
      { name: "Burned", x: 455, w: 60 },
      { name: "Steps", x: 515, w: 60 },
    ];
    doc.fontSize(9).fillColor(COLORS.muted).font("Helvetica-Bold");
    for (const c of cols) {
      doc.text(c.name, c.x, tableTop, { width: c.w });
    }
    doc.moveDown(0.3);
    let rowY = doc.y;
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.text);
    for (const d of days) {
      // Row background
      doc.rect(50, rowY - 2, doc.page.width - 100, 16).fillColor(COLORS.bg).fill();
      doc.fillColor(COLORS.text).fontSize(9).font("Helvetica");
      doc.text(d.date, cols[0].x, rowY, { width: cols[0].w });
      doc.text(faNum(d.calories), cols[1].x, rowY, { width: cols[1].w });
      doc.text(`${faNum(d.protein)}g`, cols[2].x, rowY, { width: cols[2].w });
      doc.text(`${faNum(d.carbs)}g`, cols[3].x, rowY, { width: cols[3].w });
      doc.text(`${faNum(d.fat)}g`, cols[4].x, rowY, { width: cols[4].w });
      doc.text(faNum(d.water), cols[5].x, rowY, { width: cols[5].w });
      doc.text(faNum(d.burned), cols[6].x, rowY, { width: cols[6].w });
      doc.text(faNum(d.steps), cols[7].x, rowY, { width: cols[7].w });
      rowY += 18;
    }
    doc.y = rowY + 0.4;

    // Macro breakdown bars
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text("Macro Breakdown (totals)");
    doc.moveDown(0.4);
    drawMacroBar(doc, "Protein", Math.round(total.protein), goals.protein * days.length, COLORS.protein);
    drawMacroBar(doc, "Carbs", Math.round(total.carbs), goals.carbs * days.length, COLORS.carbs);
    drawMacroBar(doc, "Fat", Math.round(total.fat), goals.fat * days.length, COLORS.fats);
    doc.moveDown(0.5);

    // Weight trend
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text("Weight Trend");
    doc.moveDown(0.3);
    const weightDays = days.filter((d) => d.weight != null);
    if (weightDays.length === 0) {
      doc.fontSize(10).fillColor(COLORS.muted).font("Helvetica").text("No weight data recorded in this range.");
    } else {
      doc.fontSize(9).fillColor(COLORS.muted).font("Helvetica-Bold");
      doc.text("Date", 50, doc.y, { width: 100 });
      doc.text("Weight (kg)", 200, doc.y, { width: 100 });
      doc.moveDown(0.3);
      doc.font("Helvetica").fillColor(COLORS.text).fontSize(9);
      for (const d of weightDays) {
        doc.text(d.date, 50, doc.y, { width: 100 });
        doc.text(`${d.weight!.toFixed(1)} kg`, 200, doc.y, { width: 100 });
        doc.moveDown(0.2);
      }
    }
    doc.moveDown(0.5);

    // Water intake
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text("Water Intake");
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor(COLORS.muted).font("Helvetica");
    doc.text(`Total: ${Math.round(total.water / 1000 * 10) / 10} L over ${days.length} day(s)`);
    doc.text(`Average: ${Math.round(total.water / days.length / 10) / 100} L/day`);
    doc.moveDown(0.5);

    // Workout history
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.5);
    doc.fontSize(14).fillColor(COLORS.text).font("Helvetica-Bold").text("Workout History");
    doc.moveDown(0.3);
    if (workouts.length === 0) {
      doc.fontSize(10).fillColor(COLORS.muted).font("Helvetica").text("No workouts logged in this range.");
    } else {
      // Table header
      doc.fontSize(9).fillColor(COLORS.muted).font("Helvetica-Bold");
      doc.text("Date", 50, doc.y, { width: 90 });
      doc.text("Type", 140, doc.y, { width: 130 });
      doc.text("Duration", 270, doc.y, { width: 80 });
      doc.text("Intensity", 350, doc.y, { width: 80 });
      doc.text("Calories", 430, doc.y, { width: 80 });
      doc.moveDown(0.3);
      doc.font("Helvetica").fillColor(COLORS.text).fontSize(9);
      for (const w of workouts) {
        doc.text(String(w.date ?? "—"), 50, doc.y, { width: 90 });
        doc.text(String(w.type ?? "—"), 140, doc.y, { width: 130 });
        doc.text(`${w.durationMinutes ?? 0} min`, 270, doc.y, { width: 80 });
        doc.text(String(w.intensity ?? "—"), 350, doc.y, { width: 80 });
        doc.text(`${w.caloriesBurned ?? 0} kcal`, 430, doc.y, { width: 80 });
        doc.moveDown(0.2);
      }
    }
    doc.moveDown(0.5);

    // Footer
    drawDivider(doc, 50, doc.y, doc.page.width - 100);
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor(COLORS.muted).font("Helvetica-Oblique").text(
      "DS-Cali · AI Calorie Tracker · Generated by your health data",
      { align: "center" }
    );

    doc.end();

    // Wait for the PDF to finish
    const pdfBuffer: Buffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ds-cali-report-${todayKey}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (e) {
    console.error("[generateReport] error:", e);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}

function drawDivider(doc: InstanceType<typeof PDFDocument>, x: number, y: number, w: number) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor(COLORS.border).lineWidth(1).stroke();
}

function drawMacroBar(doc: InstanceType<typeof PDFDocument>, label: string, value: number, goal: number, color: string) {
  const y = doc.y;
  const x = 50;
  const w = doc.page.width - 100;
  doc.fontSize(10).fillColor(COLORS.text).font("Helvetica-Bold").text(label, x, y, { width: 100 });
  doc.font("Helvetica").fillColor(COLORS.muted).fontSize(9).text(`${value} / ${goal}g`, x + 100, y, { width: 100 });
  // Bar background
  const barX = x + 220;
  const barW = w - 220;
  doc.rect(barX, y + 2, barW, 8).fillColor(COLORS.bg).fill();
  // Bar fill
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  doc.rect(barX, y + 2, barW * pct, 8).fillColor(color).fill();
  doc.moveDown(0.5);
}
