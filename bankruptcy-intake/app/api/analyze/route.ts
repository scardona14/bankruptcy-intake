import { NextRequest, NextResponse } from "next/server"
import { generateText, Output } from "ai"
import { z } from "zod"

// Avoid the edge runtime when using the AI SDK.
export const runtime = "nodejs"
export const maxDuration = 60

const analysisSchema = z.object({
  recommendation: z.enum(["Chapter 7", "Chapter 13"]),
  eligibilityScore: z.number().min(60).max(98),
  summary: z.string(),
  keyReason: z.string(),
  documents: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
    }),
  ),
  nextSteps: z.array(
    z.object({
      title: z.string(),
      detail: z.string(),
    }),
  ),
  urgencyNote: z.string(),
})

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const {
    firstName,
    lastName,
    monthlyIncome,
    monthlyExpenses,
    totalDebt,
    dependents,
    employed,
    homeowner,
    hasVehicle,
    monthsBehind,
  } = body

  const prompt = `You are a bankruptcy intake analyst at a law firm. Analyze this potential client.

Client: ${firstName} ${lastName}
Monthly Income: $${monthlyIncome}
Monthly Expenses: $${monthlyExpenses}
Total Unsecured Debt: $${totalDebt}
Dependents: ${dependents}
Employment: ${employed}
Homeowner: ${homeowner}
Has Vehicle: ${hasVehicle}
Months Behind on Payments: ${monthsBehind}

Guidance:
- "recommendation" is either "Chapter 7" or "Chapter 13".
- "eligibilityScore" is a number between 60 and 98 reflecting how strong a candidate they are for the recommended chapter.
- "summary" is a 2-3 sentence plain-English explanation tailored to their numbers.
- "keyReason" is the single most important deciding factor.
- "documents" is a list of 5-7 documents tailored to their situation, each with a name and a short description of why it is needed and what counts.
- "nextSteps" is a list of exactly 4 steps, each with a title and a detail explaining what to do and why.
- "urgencyNote" is one sentence about timing or risks.
Be specific to their numbers.`

  try {
    const { experimental_output: result } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      prompt,
      experimental_output: Output.object({ schema: analysisSchema }),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.log("[v0] analyze route error:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 })
  }
}
