"use client"

import { useState } from "react"

type FormState = {
  firstName: string
  lastName: string
  monthlyIncome: string
  monthlyExpenses: string
  totalDebt: string
  dependents: string
  employed: string
  homeowner: string
  hasVehicle: string
  monthsBehind: string
}

type AnalysisResult = {
  recommendation: "Chapter 7" | "Chapter 13"
  eligibilityScore: number
  summary: string
  keyReason: string
  documents: { name: string; description: string }[]
  nextSteps: { title: string; detail: string }[]
  urgencyNote: string
}

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  monthlyIncome: "",
  monthlyExpenses: "",
  totalDebt: "",
  dependents: "0",
  employed: "Yes",
  homeowner: "No",
  hasVehicle: "No",
  monthsBehind: "0",
}

type Stage = "form" | "analyzing" | "results"

export default function Home() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [stage, setStage] = useState<Stage>("form")
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const requiredFilled =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.monthlyIncome !== "" &&
    form.monthlyExpenses !== "" &&
    form.totalDebt !== ""

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!requiredFilled) return
    setError(null)
    setStage("analyzing")
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Analysis failed")
      const data = (await res.json()) as AnalysisResult
      setResult(data)
      setStage("results")
    } catch {
      setError("We couldn't complete the analysis. Please try again.")
      setStage("form")
    }
  }

  function restart() {
    setForm(INITIAL_FORM)
    setResult(null)
    setError(null)
    setStage("form")
  }

  const currentStep = stage === "form" ? 1 : stage === "analyzing" ? 2 : 3

  return (
    <div className="page-wrapper">
      <header className="header">
        <div className="header-logo">
          Hart<span>&amp;</span>Crane Legal
        </div>
        <div className="header-badge">Bankruptcy Intake</div>
      </header>

      <section className="hero">
        <p className="hero-eyebrow">Confidential Case Assessment</p>
        <h1>
          Find out where you stand <em>in minutes</em>
        </h1>
        <p className="hero-sub">
          Answer a few questions about your finances and receive a preliminary
          assessment of your bankruptcy options, prepared for your attorney
          consultation.
        </p>
      </section>

      <main className="main">
        <StepIndicator current={currentStep} />

        {stage === "form" && (
          <form className="form-card" onSubmit={handleSubmit}>
            <h2 className="form-section-title">Tell us about your situation</h2>
            <p className="form-section-sub">
              All information is confidential and used only to assess your
              options. Required fields are marked with an asterisk.
            </p>

            <div className="field-grid">
              <Field label="First Name *">
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => update("firstName")(e.target.value)}
                  required
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Last Name *">
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => update("lastName")(e.target.value)}
                  required
                  autoComplete="family-name"
                />
              </Field>

              <Field label="Monthly Income *" hint="After-tax take-home pay">
                <NumberInput value={form.monthlyIncome} onChange={update("monthlyIncome")} placeholder="0" />
              </Field>
              <Field label="Monthly Expenses *" hint="Rent, utilities, food, etc.">
                <NumberInput value={form.monthlyExpenses} onChange={update("monthlyExpenses")} placeholder="0" />
              </Field>

              <Field label="Total Unsecured Debt *" hint="Credit cards, medical, personal loans">
                <NumberInput value={form.totalDebt} onChange={update("totalDebt")} placeholder="0" />
              </Field>
              <Field label="Dependents">
                <NumberInput value={form.dependents} onChange={update("dependents")} placeholder="0" />
              </Field>
            </div>

            <div className="form-divider" />

            <div className="field-grid">
              <Choice
                label="Currently Employed?"
                name="employed"
                value={form.employed}
                onChange={update("employed")}
                options={["Yes", "No"]}
              />
              <Choice
                label="Do you own a home?"
                name="homeowner"
                value={form.homeowner}
                onChange={update("homeowner")}
                options={["Yes", "No"]}
              />
              <Choice
                label="Do you own a vehicle?"
                name="hasVehicle"
                value={form.hasVehicle}
                onChange={update("hasVehicle")}
                options={["Yes", "No"]}
              />
              <Field label="Months Behind on Payments">
                <NumberInput value={form.monthsBehind} onChange={update("monthsBehind")} placeholder="0" />
              </Field>
            </div>

            {error && <div className="error-box">{error}</div>}

            <button type="submit" className="btn-analyze" disabled={!requiredFilled}>
              Analyze My Options
              <span aria-hidden="true">&rarr;</span>
            </button>

            <p className="disclaimer">
              This tool provides a preliminary, automated assessment for
              informational purposes only. It is not legal advice and does not
              create an attorney-client relationship.
            </p>
          </form>
        )}

        {stage === "analyzing" && (
          <div className="form-card">
            <div className="analyzing-state">
              <div className="spinner" role="status" aria-label="Analyzing" />
              <h3>Analyzing your situation</h3>
              <p>Reviewing your income, debt, and eligibility factors&hellip;</p>
            </div>
          </div>
        )}

        {stage === "results" && result && (
          <Results result={result} onRestart={restart} />
        )}
      </main>

      <footer className="footer">
        Hart<span>&amp;</span>Crane Legal &middot; Confidential intake assessment
      </footer>
    </div>
  )
}

function StepIndicator({ current }: { current: number }) {
  const labels = ["Your Details", "Analysis", "Results"]
  const stateFor = (step: number) =>
    step < current ? "complete" : step === current ? "active" : "pending"
  return (
    <>
      <div className="step-indicator">
        {labels.map((_, i) => {
          const step = i + 1
          return (
            <span key={step} style={{ display: "contents" }}>
              <span className={`step-dot ${stateFor(step)}`}>
                {step < current ? "\u2713" : step}
              </span>
              {step < labels.length && (
                <span className={`step-line ${step < current ? "complete" : ""}`} />
              )}
            </span>
          )
        })}
      </div>
      <div className="step-labels">
        {labels.map((label, i) => (
          <span key={label} className={`step-label ${i + 1 === current ? "active" : ""}`}>
            {label}
          </span>
        ))}
      </div>
    </>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  )
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function Choice({
  label,
  name,
  value,
  onChange,
  options,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  options: string[]
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="radio-group">
        {options.map((opt) => {
          const id = `${name}-${opt}`
          return (
            <div className="radio-option" key={id}>
              <input
                type="radio"
                id={id}
                name={name}
                checked={value === opt}
                onChange={() => onChange(opt)}
              />
              <label htmlFor={id}>{opt}</label>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Results({
  result,
  onRestart,
}: {
  result: AnalysisResult
  onRestart: () => void
}) {
  const isCh7 = result.recommendation === "Chapter 7"
  return (
    <div>
      <div className="results-header">
        <p className="results-eyebrow">Preliminary Assessment</p>
        <h2>Here&apos;s what we found</h2>
      </div>

      <div className={`recommendation-card ${isCh7 ? "ch7" : "ch13"}`}>
        <p className="rec-label">Recommended Path</p>
        <p className="rec-title">{result.recommendation}</p>
        <p className="rec-body">{result.summary}</p>
        <p className="rec-body" style={{ marginTop: "0.75rem" }}>
          <strong>Key factor:</strong> {result.keyReason}
        </p>

        <div className="eligibility-bar-wrap">
          <div className="eligibility-label">
            <span>Eligibility Strength</span>
            <span>{result.eligibilityScore}%</span>
          </div>
          <div className="eligibility-bar">
            <div className="eligibility-fill" style={{ width: `${result.eligibilityScore}%` }} />
          </div>
        </div>
      </div>

      <div className="checklist-card">
        <div className="checklist-header">
          <h3>Documents to Gather</h3>
        </div>
        <div className="checklist-body">
          {result.documents.map((doc) => (
            <div className="checklist-item" key={doc.name}>
              <span className="check-icon" aria-hidden="true">
                {"\u2713"}
              </span>
              <span className="checklist-item-text">
                <strong>{doc.name}</strong>
                <span>{doc.description}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="next-steps-card">
        <h3>Your Next Steps</h3>
        {result.nextSteps.map((step, i) => (
          <div className="next-step-item" key={step.title}>
            <span className="step-num-badge">{i + 1}</span>
            <span className="next-step-text">
              <strong>{step.title}.</strong> {step.detail}
            </span>
          </div>
        ))}
      </div>

      <div className="cta-card">
        <h3>Ready to take the next step?</h3>
        <p>{result.urgencyNote}</p>
        <button type="button" className="btn-cta">
          Schedule a Free Consultation
        </button>
        <button type="button" className="btn-restart" onClick={onRestart}>
          Start a new assessment
        </button>
      </div>

      <p className="disclaimer">
        This assessment is automated and informational only. It is not legal
        advice and does not create an attorney-client relationship. Speak with a
        licensed bankruptcy attorney before making any decisions.
      </p>
    </div>
  )
}
