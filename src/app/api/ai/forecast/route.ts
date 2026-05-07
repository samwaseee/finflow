// src/app/api/ai/forecast/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrgIdFromSession } from "@/lib/api-helpers";

type MonthStats = {
  revenue: number;
  expenses: number;
  outstanding: number;
};

type ForecastData = {
  summary: string;
  forecast: {
    month: string;
    projectedRevenue: number;
    projectedExpenses: number;
    projectedProfit: number;
  }[];
  insights: { type: "positive" | "warning" | "suggestion"; text: string }[];
  healthScore: number;
};

async function generateForecast(orgId: string) {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: { orgId, createdAt: { gte: sixMonthsAgo } },
      select: { total: true, status: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: { orgId, date: { gte: sixMonthsAgo } },
      select: { amount: true, category: true, date: true },
    }),
  ]);

  const months: { [key: string]: MonthStats } = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    months[key] = { revenue: 0, expenses: 0, outstanding: 0 };
  }

  for (const inv of invoices) {
    const key = inv.createdAt.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (!months[key]) continue;
    if (inv.status === "PAID") {
      months[key].revenue += Number(inv.total);
    } else if (inv.status === "SENT" || inv.status === "OVERDUE") {
      months[key].outstanding += Number(inv.total);
    }
  }

  for (const exp of expenses) {
    const key = exp.date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
    if (!months[key]) continue;
    months[key].expenses += Number(exp.amount);
  }

  const monthlyData = Object.entries(months).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    expenses: data.expenses,
    outstanding: data.outstanding,
    profit: data.revenue - data.expenses,
  }));

  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = monthlyData.reduce((s, m) => s + m.expenses, 0);
  const totalOutstanding = monthlyData.reduce((s, m) => s + m.outstanding, 0);
  const avgRevenue = totalRevenue / (monthlyData.length || 1);
  const avgExpenses = totalExpenses / (monthlyData.length || 1);

  const revenueGrowthRate = (() => {
    const recent = monthlyData.slice(-2).map((m) => m.revenue);
    if (!recent[0]) return 0.05;
    return Math.min(0.15, Math.max(-0.05, (recent[1] - recent[0]) / recent[0]));
  })();

  const today = new Date();
  const forecastMonths = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  });

  const prompt = `You are a financial analyst AI. Analyze this business's last 6 months of financial data and provide a cash flow forecast and insights.

FINANCIAL DATA (Last 6 months):
${monthlyData
    .map(
      (m) =>
        `${m.month}: Revenue $${m.revenue.toFixed(2)}, Expenses $${m.expenses.toFixed(2)}, Outstanding $${m.outstanding.toFixed(2)}, Profit $${m.profit.toFixed(2)}`
    )
    .join("\n")}

SUMMARY:
- Total Revenue: $${totalRevenue.toFixed(2)}
- Total Expenses: $${totalExpenses.toFixed(2)}
- Total Outstanding: $${totalOutstanding.toFixed(2)}
- Net Profit: $${(totalRevenue - totalExpenses).toFixed(2)}

Please respond ONLY with a valid JSON object in this exact format, no markdown, no explanation outside the JSON:
{
  "summary": "2-3 sentence overview of the business financial health",
  "forecast": [
    { "month": "${forecastMonths[0]}", "projectedRevenue": 0, "projectedExpenses": 0, "projectedProfit": 0 },
    { "month": "${forecastMonths[1]}", "projectedRevenue": 0, "projectedExpenses": 0, "projectedProfit": 0 },
    { "month": "${forecastMonths[2]}", "projectedRevenue": 0, "projectedExpenses": 0, "projectedProfit": 0 }
  ],
  "insights": [
    { "type": "positive", "text": "insight text here" },
    { "type": "warning", "text": "insight text here" },
    { "type": "suggestion", "text": "insight text here" }
  ],
  "healthScore": 75
}

Rules:
- forecast months must be exactly: ${forecastMonths.join(", ")}
- projectedRevenue/Expenses/Profit should be realistic numbers based on trends, not 0
- healthScore is 0-100 based on profitability, growth trend, and outstanding invoices
- insights array should have 3-5 items mixing positive/warning/suggestion types
- All numbers must be actual integers or floats, not strings
- YOUR ENTIRE RESPONSE MUST BE ONLY THE JSON OBJECT. NO text before or after it. NO markdown. NO explanation. Start your response with { and end with }`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini error: ${await response.text()}`);
  }

  const aiData = await response.json();
  const part = aiData.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!part) throw new Error("Empty response from Gemini");

  const jsonMatch = part.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  const forecast: ForecastData = JSON.parse(jsonMatch[0]);
  return { forecast, monthlyData };
}

export async function GET(req: Request) {
  const { orgId, error, status } = await getOrgIdFromSession();
  if (error || !orgId)
    return NextResponse.json({ error: error ?? "No organization" }, { status: status ?? 404 });

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";
  const now = new Date();

  // Check cache first
  if (!forceRefresh) {
    const cached = await prisma.forecastCache.findUnique({
      where: { orgId },
    });

    if (cached && cached.expiresAt > now) {
      const parsed = JSON.parse(cached.data);
      return NextResponse.json({
        ...parsed,
        cached: true,
        expiresAt: cached.expiresAt,
      });
    }
  }

  // Generate fresh forecast
  try {
    const result = await generateForecast(orgId);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.forecastCache.upsert({
      where: { orgId },
      update: { data: JSON.stringify(result), createdAt: now, expiresAt },
      create: { orgId, data: JSON.stringify(result), expiresAt },
    });

    return NextResponse.json({ ...result, cached: false, expiresAt });
  } catch (err) {
    console.error("Forecast generation failed:", err);

    const staleCache = await prisma.forecastCache.findUnique({
      where: { orgId },
    });

    if (staleCache) {
      const parsed = JSON.parse(staleCache.data);
      return NextResponse.json({
        ...parsed,
        cached: true,
        stale: true,
        expiresAt: staleCache.expiresAt,
      });
    }

    return NextResponse.json(
      { error: "AI forecast temporarily unavailable." },
      { status: 503 }
    );
  }
}