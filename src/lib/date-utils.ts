// Date formatting utility — supports Shamsi (Jalali) calendar for Persian locale
// and Gregorian calendar for English locale.
import { toJalaali } from "jalaali-js";

const PERSIAN_MONTHS = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
];

const PERSIAN_WEEKDAYS = ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"];
const PERSIAN_WEEKDAYS_SHORT = ["ی", "د", "س", "چ", "پ", "ج", "ش"];

const ENGLISH_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const ENGLISH_WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ENGLISH_WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toPersianDigits(str: string | number): string {
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(str).replace(/[0-9]/g, (d) => persianDigits[Number(d)]);
}

export function formatDate(date: Date | string, locale: "fa" | "en", opts?: { weekday?: boolean; month?: "short" | "long"; day?: boolean }): string {
  const d = typeof date === "string" ? new Date(date) : date;

  if (locale === "fa") {
    const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const weekday = d.getDay();
    const parts: string[] = [];

    if (opts?.weekday) {
      parts.push(PERSIAN_WEEKDAYS[weekday]);
    }
    if (opts?.day) {
      parts.push(toPersianDigits(j.jd));
    }
    if (opts?.month) {
      parts.push(PERSIAN_MONTHS[j.jm - 1]);
    }

    return parts.join(" ");
  }

  const parts: string[] = [];
  if (opts?.weekday) parts.push(ENGLISH_WEEKDAYS[d.getDay()]);
  if (opts?.day) parts.push(String(d.getDate()));
  if (opts?.month) parts.push(ENGLISH_MONTHS[d.getMonth()]);
  return parts.join(" ");
}

export function formatTime(date: Date | string, locale: "fa" | "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? (locale === "fa" ? "ب.ظ" : "PM") : (locale === "fa" ? "ق.ظ" : "AM");
  hours = hours % 12 || 12;
  const timeStr = `${hours}:${String(minutes).padStart(2, "0")} ${ampm}`;
  return locale === "fa" ? toPersianDigits(timeStr) : timeStr;
}

export function formatNumber(num: number, locale: "fa" | "en"): string {
  if (locale === "fa") {
    return toPersianDigits(num.toLocaleString("en-US"));
  }
  return num.toLocaleString("en-US");
}

export function getWeekdayShort(date: Date | string, locale: "fa" | "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "fa") return PERSIAN_WEEKDAYS_SHORT[d.getDay()];
  return ENGLISH_WEEKDAYS_SHORT[d.getDay()];
}

export function getDayNumber(date: Date | string, locale: "fa" | "en"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (locale === "fa") {
    const j = toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return toPersianDigits(j.jd);
  }
  return String(d.getDate());
}

export { toPersianDigits };
