"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Apple, Mail, Phone, User, ArrowRight, X, Check, Shield } from "lucide-react";
import { useApp } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { startPremiumTrial } from "@/lib/subscription";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  provider: "google" | "phone" | "guest";
}

const STORAGE_KEY = "ds-cali-auth-user";

function saveAuthUser(user: AuthUser): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {}
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function clearAuthUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function LoginScreen() {
  const { setModal } = useApp();
  const { locale, t } = useI18n();
  const [mode, setMode] = useState<"choose" | "phone-input" | "phone-verify" | "guest-input">("choose");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [loading, setLoading] = useState(false);

  function loginWithGoogle() {
    setLoading(true);
    // NOTE: This is a mock. To enable real Google Sign-In:
    // 1. Install @capacitor-community/google-sign-in or use Firebase Auth
    // 2. Configure OAuth client ID in Google Cloud Console
    // 3. Add the client ID to AndroidManifest.xml
    // 4. Replace this mock with the real plugin call.
    // See instructions/DEVELOPER-GUIDE.md → "How to enable real Google Sign-In"
    setTimeout(() => {
      const user: AuthUser = {
        id: "google-" + Date.now(),
        name: "Google User",
        email: "user@gmail.com",
        phone: "",
        photoUrl: null,
        provider: "google",
      };
      saveAuthUser(user);
      startPremiumTrial(7); // 7-day free trial for new users
      setLoading(false);
      toast.success(locale === "fa" ? "ورود با گوگل موفق بود! ۷ روز پریمیوم رایگان فعال شد." : "Google sign-in successful! 7-day premium trial activated.");
      setModal(null);
      setTimeout(() => window.location.reload(), 500);
    }, 1000);
  }

  function loginWithPhone() {
    setMode("phone-input");
  }

  function sendCode() {
    if (!phone.trim()) {
      toast.error(locale === "fa" ? "شماره تلفن را وارد کنید" : "Enter your phone number");
      return;
    }
    setLoading(true);
    // NOTE: This is a mock. To enable real phone auth:
    // 1. Set up Firebase Auth with phone authentication
    // 2. Configure reCAPTCHA verifier
    // 3. Replace this mock with Firebase's signInWithPhoneNumber.
    setTimeout(() => {
      setLoading(false);
      setMode("phone-verify");
      toast.success(locale === "fa" ? "کد تایید ارسال شد (کد تست: ۱۲۳۴)" : "Verification code sent (test code: 1234)");
    }, 800);
  }

  function verifyCode() {
    if (verificationCode !== "1234") {
      toast.error(locale === "fa" ? "کد نادرست. کد تست: ۱۲۳۴" : "Wrong code. Test code: 1234");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user: AuthUser = {
        id: "phone-" + Date.now(),
        name: "User " + phone.slice(-4),
        email: "",
        phone,
        photoUrl: null,
        provider: "phone",
      };
      saveAuthUser(user);
      startPremiumTrial(7);
      setLoading(false);
      toast.success(locale === "fa" ? "ورود موفق بود! ۷ روز پریمیوم رایگان فعال شد." : "Login successful! 7-day premium trial activated.");
      setModal(null);
      setTimeout(() => window.location.reload(), 500);
    }, 800);
  }

  function continueAsGuest() {
    setMode("guest-input");
  }

  function createGuest() {
    if (!guestName.trim()) {
      toast.error(locale === "fa" ? "نام خود را وارد کنید" : "Enter your name");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const user: AuthUser = {
        id: "guest-" + Date.now(),
        name: guestName,
        email: "",
        phone: "",
        photoUrl: null,
        provider: "guest",
      };
      saveAuthUser(user);
      setLoading(false);
      toast.success(locale === "fa" ? "خوش آمدید!" : "Welcome!");
      setModal(null);
      setTimeout(() => window.location.reload(), 500);
    }, 500);
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setModal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-base font-semibold">{t("welcomeToCalAI")}</h2>
        <div className="h-9 w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Hero */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-gradient-to-br from-streak to-protein shadow-fab"
        >
          <Apple className="h-10 w-10 text-white" />
        </motion.div>

        {mode === "choose" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h1 className="text-center text-2xl font-bold">{t("welcomeToCalAI")}</h1>
            <p className="text-center text-sm text-muted-foreground">{t("welcomeDesc")}</p>

            <div className="mt-6 space-y-3">
              {/* Google */}
              <Button
                onClick={loginWithGoogle}
                disabled={loading}
                variant="outline"
                className="w-full rounded-full py-3 border-2"
              >
                <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? "..." : (locale === "fa" ? "ادامه با گوگل" : "Continue with Google")}
              </Button>

              {/* Phone */}
              <Button
                onClick={loginWithPhone}
                disabled={loading}
                variant="outline"
                className="w-full rounded-full py-3 border-2"
              >
                <Phone className="mr-3 h-5 w-5 text-success" />
                {locale === "fa" ? "ادامه با شماره تلفن" : "Continue with Phone"}
              </Button>

              {/* Guest */}
              <Button
                onClick={continueAsGuest}
                disabled={loading}
                variant="ghost"
                className="w-full rounded-full py-3 text-muted-foreground"
              >
                <User className="mr-3 h-5 w-5" />
                {locale === "fa" ? "ادامه به عنوان مهمان" : "Continue as Guest"}
              </Button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              {locale === "fa" ? "داده‌های شما روی دستگاه ذخیره می‌شود" : "Your data stays on your device"}
            </p>
          </motion.div>
        )}

        {mode === "phone-input" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{locale === "fa" ? "شماره تلفن" : "Phone Number"}</h2>
              <p className="text-sm text-muted-foreground">{locale === "fa" ? "کد تایید برای شما پیامک می‌شود" : "We'll send you a verification code"}</p>
            </div>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={locale === "fa" ? "۰۹۱۲۳۴۵۶۷۸" : "+98 912 345 678"}
              inputMode="tel"
              className="rounded-xl bg-secondary border-0 h-14 text-lg"
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
            />
            <Button onClick={sendCode} disabled={loading} className="w-full rounded-full py-3">
              {loading ? "..." : (locale === "fa" ? "ارسال کد" : "Send Code")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => setMode("choose")} variant="ghost" className="w-full">
              {locale === "fa" ? "بازگشت" : "Back"}
            </Button>
          </motion.div>
        )}

        {mode === "phone-verify" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{locale === "fa" ? "کد تایید" : "Verification Code"}</h2>
              <p className="text-sm text-muted-foreground">
                {locale === "fa" ? `کد به شماره ${phone} ارسال شد` : `Code sent to ${phone}`}
              </p>
            </div>
            <Input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="1234"
              inputMode="numeric"
              maxLength={6}
              className="rounded-xl bg-secondary border-0 h-14 text-2xl text-center tracking-widest"
              onKeyDown={(e) => e.key === "Enter" && verifyCode()}
            />
            <Button onClick={verifyCode} disabled={loading} className="w-full rounded-full py-3">
              {loading ? "..." : (locale === "fa" ? "تایید" : "Verify")}
              <Check className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => setMode("phone-input")} variant="ghost" className="w-full">
              {locale === "fa" ? "تغییر شماره" : "Change number"}
            </Button>
          </motion.div>
        )}

        {mode === "guest-input" && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{locale === "fa" ? "نام شما" : "Your Name"}</h2>
              <p className="text-sm text-muted-foreground">{locale === "fa" ? "برای شخصی‌سازی برنامه" : "To personalize your experience"}</p>
            </div>
            <Input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={locale === "fa" ? "نام" : "Your name"}
              className="rounded-xl bg-secondary border-0 h-14 text-lg"
              onKeyDown={(e) => e.key === "Enter" && createGuest()}
            />
            <Button onClick={createGuest} disabled={loading} className="w-full rounded-full py-3">
              {loading ? "..." : (locale === "fa" ? "شروع" : "Get Started")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => setMode("choose")} variant="ghost" className="w-full">
              {locale === "fa" ? "بازگشت" : "Back"}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
