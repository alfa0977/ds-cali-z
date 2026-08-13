"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, Check, Apple } from "lucide-react";
import { useOnboard } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Sex = "male" | "female" | "other";
type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "lose" | "maintain" | "gain";

const STEPS = ["Welcome", "About you", "Activity", "Goal", "Ready"] as const;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [sex, setSex] = useState<Sex | null>(null);
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [activityLevel, setActivityLevel] = useState<Activity | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);
  const onboard = useOnboard();

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  function finish() {
    if (!sex || !activityLevel || !goal) return;
    onboard.mutate(
      {
        displayName: displayName || "Friend",
        sex,
        age: Number(age) || 30,
        heightCm: Number(heightCm) || 170,
        weightKg: Number(weightKg) || 70,
        activityLevel,
        goal,
      },
      { onSuccess: () => setStep(4) }
    );
  }

  const canProceed =
    step === 0 ||
    (step === 1 && displayName && sex && age && heightCm && weightKg) ||
    (step === 2 && activityLevel) ||
    (step === 3 && goal) ||
    step === 4;

  return (
    <div className="phone-frame bg-background flex flex-col overflow-hidden">
      {step < 4 && (
        <div className="flex gap-1.5 px-6 pt-6">
          {STEPS.slice(0, 4).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-foreground" : "bg-muted"
              )}
            />
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-streak to-protein shadow-fab"
              >
                <Apple className="h-12 w-12 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome to CalAI</h1>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Track meals with AI vision, hit your macros, and build healthy habits — all in one beautiful app.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  { icon: "📸", text: "Snap a photo, get instant nutrition" },
                  { icon: "🎯", text: "Personalized macro goals" },
                  { icon: "📊", text: "Track progress over time" },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-ios"
                  >
                    <span className="text-2xl">{f.icon}</span>
                    <span className="text-sm font-medium">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-bold">About you</h2>
                <p className="text-sm text-muted-foreground">Let's personalize your experience</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Your name</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Alex" className="rounded-xl bg-secondary border-0 h-12" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Biological sex</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["male", "female", "other"] as Sex[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={cn(
                        "rounded-xl border-2 py-3 text-sm font-medium capitalize transition-colors",
                        sex === s ? "border-foreground bg-card" : "border-border bg-card text-muted-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Age</label>
                  <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" className="rounded-xl bg-secondary border-0 h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Height</label>
                  <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="170" className="rounded-xl bg-secondary border-0 h-12" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Weight</label>
                  <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" className="rounded-xl bg-secondary border-0 h-12" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Units: cm and kg</p>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-bold">Activity level</h2>
                <p className="text-sm text-muted-foreground">How active are you day-to-day?</p>
              </div>
              <div className="space-y-2">
                {([
                  { key: "sedentary", label: "Sedentary", desc: "Little or no exercise, desk job", emoji: "🪑" },
                  { key: "light", label: "Lightly active", desc: "Light exercise 1-3 days/week", emoji: "🚶" },
                  { key: "moderate", label: "Moderately active", desc: "Moderate exercise 3-5 days/week", emoji: "🏃" },
                  { key: "active", label: "Very active", desc: "Hard exercise 6-7 days/week", emoji: "💪" },
                  { key: "very_active", label: "Extra active", desc: "Very hard exercise, physical job", emoji: "🔥" },
                ] as { key: Activity; label: string; desc: string; emoji: string }[]).map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setActivityLevel(a.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                      activityLevel === a.key ? "border-foreground bg-card" : "border-border bg-card"
                    )}
                  >
                    <span className="text-2xl">{a.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{a.label}</div>
                      <div className="text-xs text-muted-foreground">{a.desc}</div>
                    </div>
                    {activityLevel === a.key && <Check className="h-5 w-5 text-foreground" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="goal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <h2 className="text-2xl font-bold">Your goal</h2>
                <p className="text-sm text-muted-foreground">What do you want to achieve?</p>
              </div>
              <div className="space-y-2">
                {([
                  { key: "lose", label: "Lose weight", desc: "~0.5 kg/week deficit", emoji: "📉", color: "var(--protein)" },
                  { key: "maintain", label: "Maintain weight", desc: "Stay at current weight", emoji: "⚖️", color: "var(--carbs)" },
                  { key: "gain", label: "Gain muscle", desc: "~0.4 kg/week surplus", emoji: "📈", color: "var(--success)" },
                ] as { key: Goal; label: string; desc: string; emoji: string; color: string }[]).map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setGoal(g.key)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors",
                      goal === g.key ? "border-foreground bg-card" : "border-border bg-card"
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl" style={{ backgroundColor: `color-mix(in srgb, ${g.color} 15%, transparent)` }}>
                      {g.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{g.label}</div>
                      <div className="text-xs text-muted-foreground">{g.desc}</div>
                    </div>
                    {goal === g.key && <Check className="h-5 w-5 text-foreground" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="ready"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-success shadow-fab"
              >
                <Check className="h-12 w-12 text-white" strokeWidth={3} />
              </motion.div>
              <h1 className="text-3xl font-bold">You're all set!</h1>
              <p className="mt-3 max-w-xs text-sm text-muted-foreground">
                Your personalized macro goals have been calculated. Start logging meals to hit your targets.
              </p>
              {onboard.data?.goals && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 w-full max-w-xs rounded-2xl bg-card p-4 shadow-ios"
                >
                  <div className="mb-3 text-sm font-semibold">Your daily goals</div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <GoalStat label="Cal" value={onboard.data.goals.calories} color="var(--streak)" />
                    <GoalStat label="Protein" value={onboard.data.goals.protein} unit="g" color="var(--protein)" />
                    <GoalStat label="Carbs" value={onboard.data.goals.carbs} unit="g" color="var(--carbs)" />
                    <GoalStat label="Fats" value={onboard.data.goals.fat} unit="g" color="var(--fats)" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-border bg-card px-6 py-4 pb-safe">
        {step < 4 ? (
          <div className="flex items-center gap-3">
            {step > 0 && (
              <Button variant="ghost" size="icon" onClick={back} className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <Button
              className="flex-1 rounded-full py-3"
              size="lg"
              disabled={!canProceed}
              onClick={step === 3 ? finish : next}
            >
              {step === 0 ? "Get started" : step === 3 ? "Calculate my goals" : "Continue"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button className="w-full rounded-full py-3" size="lg" onClick={() => window.location.reload()}>
            Start tracking
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function GoalStat({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div>
      <div className="text-lg font-bold tabular-nums" style={{ color }}>{value}{unit}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}
