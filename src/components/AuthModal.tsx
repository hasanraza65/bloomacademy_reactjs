import React, { useState, useRef, useEffect, forwardRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
// @ts-ignore
import tzlookup from "tz-lookup";


import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  X,
  Camera,
  Globe,
  Trash2,
  Plus,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Users,
  Lock,
  Mail,
  Gamepad2,
  Sparkles,
  User as UserIcon,
  MapPin,
  Calendar as CalendarIcon,
  Phone,
  Check,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  DAYS,
  TIME_SLOTS,
  AuthMode,
  ChildData,
  INITIAL_SCHEDULE,
  DaySchedule,
  UserRole,
  User as UserType,
} from "@/src/types";
import { apiService } from "@/src/services/apiService";
import { useLanguage } from "../context/LanguageContext";
import Logo from '../public/images/logo.png'

const COUNTRIES = [
  { code: "+1", name: "USA", flag: "🇺🇸" },
  { code: "+44", name: "UK", flag: "🇬🇧" },
  { code: "+92", name: "PK", flag: "🇵🇰" },
  { code: "+91", name: "IN", flag: "🇮🇳" },
  { code: "+971", name: "UAE", flag: "🇦🇪" },
  { code: "+61", name: "AUS", flag: "🇦🇺" },
  { code: "+1", name: "CAN", flag: "🇨🇦" },
  { code: "+49", name: "GER", flag: "🇩🇪" },
  { code: "+33", name: "FRA", flag: "🇫🇷" },
];

const TIMEZONES = [
  { value: "Pacific/Midway", label: "(UTC-11:00) Midway Island" },
  { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },
  { value: "America/Anchorage", label: "(UTC-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US)" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time (US)" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time (US)" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time (US)" },
  { value: "America/Halifax", label: "(UTC-04:00) Atlantic Time" },
  { value: "America/St_Johns", label: "(UTC-03:30) Newfoundland" },
  {
    value: "America/Argentina/Buenos_Aires",
    label: "(UTC-03:00) Buenos Aires",
  },
  { value: "America/Sao_Paulo", label: "(UTC-03:00) São Paulo" },
  { value: "Atlantic/Azores", label: "(UTC-01:00) Azores" },

  { value: "Europe/London", label: "(UTC+00:00) London" },
  { value: "Europe/Paris", label: "(UTC+01:00) Central European Time" },
  { value: "Europe/Berlin", label: "(UTC+01:00) Berlin" },
  { value: "Europe/Rome", label: "(UTC+01:00) Rome" },
  { value: "Europe/Madrid", label: "(UTC+01:00) Madrid" },
  { value: "Europe/Amsterdam", label: "(UTC+01:00) Amsterdam" },
  { value: "Europe/Zurich", label: "(UTC+01:00) Zurich" },
  { value: "Europe/Stockholm", label: "(UTC+01:00) Stockholm" },
  { value: "Europe/Warsaw", label: "(UTC+01:00) Warsaw" },
  { value: "Europe/Athens", label: "(UTC+02:00) Athens" },
  { value: "Europe/Helsinki", label: "(UTC+02:00) Helsinki" },
  { value: "Europe/Istanbul", label: "(UTC+03:00) Istanbul" },
  { value: "Europe/Moscow", label: "(UTC+03:00) Moscow" },

  { value: "Africa/Cairo", label: "(UTC+02:00) Cairo" },
  { value: "Africa/Johannesburg", label: "(UTC+02:00) Johannesburg" },

  { value: "Asia/Jerusalem", label: "(UTC+02:00) Jerusalem" },
  { value: "Asia/Baghdad", label: "(UTC+03:00) Baghdad" },
  { value: "Asia/Tehran", label: "(UTC+03:30) Tehran" },
  { value: "Asia/Dubai", label: "(UTC+04:00) Dubai" },
  { value: "Asia/Kabul", label: "(UTC+04:30) Kabul" },
  { value: "Asia/Karachi", label: "(UTC+05:00) Pakistan Standard Time" },
  { value: "Asia/Kolkata", label: "(UTC+05:30) India Standard Time" },
  { value: "Asia/Kathmandu", label: "(UTC+05:45) Kathmandu" },
  { value: "Asia/Dhaka", label: "(UTC+06:00) Dhaka" },
  { value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok" },
  { value: "Asia/Jakarta", label: "(UTC+07:00) Jakarta" },
  { value: "Asia/Singapore", label: "(UTC+08:00) Singapore" },
  { value: "Asia/Hong_Kong", label: "(UTC+08:00) Hong Kong" },
  { value: "Asia/Shanghai", label: "(UTC+08:00) China Standard Time" },
  { value: "Asia/Taipei", label: "(UTC+08:00) Taipei" },
  { value: "Asia/Seoul", label: "(UTC+09:00) Seoul" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Japan Standard Time" },

  { value: "Australia/Perth", label: "(UTC+08:00) Perth" },
  { value: "Australia/Adelaide", label: "(UTC+09:30) Adelaide" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney" },

  { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland" },
];

const CountrySelector = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedCountry =
    COUNTRIES.find((c) => c.code === value) || COUNTRIES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative h-full flex items-center" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all border border-transparent active:scale-95"
      >
        <span className="text-lg leading-none">{selectedCountry.flag}</span>
        <span className="text-[12px] font-bold text-slate-600 font-mono leading-none">
          {selectedCountry.code}
        </span>
        <ChevronRight
          size={12}
          className={cn(
            "text-slate-300 transition-transform",
            isOpen ? "-rotate-90" : "rotate-90",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-full mb-2 left-0 z-[100] w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="max-h-60 overflow-y-auto p-2 space-y-1 no-scrollbar">
              {COUNTRIES.map((c) => (
                <button
                  key={`${c.name}-${c.code}`}
                  type="button"
                  onClick={() => {
                    onChange(c.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left",
                    value === c.code
                      ? "bg-indigo-50 text-brand-indigo"
                      : "hover:bg-slate-50 text-slate-600",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{c.flag}</span>
                    <div>
                      <p className="text-[11px] font-bold leading-tight uppercase tracking-wide">
                        {c.name}
                      </p>
                      <p className="text-[10px] opacity-60 leading-tight font-mono">
                        {c.code}
                      </p>
                    </div>
                  </div>
                  {value === c.code && (
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-indigo shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type FormInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: any;
};

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, icon: Icon, ...props }, ref) => (
    <div className="space-y-2">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-brand-indigo text-slate-300">
          <Icon size={18} />
        </div>
        <input
          ref={ref}
          autoComplete="off"
          {...props}
          className={cn("input-field !pl-14 h-14 text-base", props.className)}
        />
      </div>
    </div>
  ),
);

FormInput.displayName = "FormInput";

const CityAutocomplete = ({
  value,
  onChange,
  onPlaceSelected,
  label,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  // @ts-ignore
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  label: string;
  placeholder: string;
}) => {
  const placesLib = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectedRef = useRef(onPlaceSelected);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onPlaceSelectedRef.current = onPlaceSelected;
  }, [onPlaceSelected]);

  useEffect(() => {
    if (!placesLib || !inputRef.current) return;

    const options = {
      types: ["geocode"], // Use geocode for more broad address matching
      fields: ["address_components", "formatted_address", "geometry"],
    };

    const autocompleteInstance = new placesLib.Autocomplete(
      inputRef.current,
      options,
    );

    const listener = autocompleteInstance.addListener("place_changed", () => {
      const place = autocompleteInstance.getPlace();
      if (place.formatted_address) {
        onChangeRef.current(place.formatted_address);
      } else if (inputRef.current?.value) {
        onChangeRef.current(inputRef.current.value);
      }

      if (onPlaceSelectedRef.current) {
        onPlaceSelectedRef.current(place);
      }
    });

    return () => {
      //@ts-ignore
      google.maps.event.removeListener(listener);
      // Clean up the pac-container elements if they exist
      const pacContainers = document.querySelectorAll(".pac-container");
      pacContainers.forEach((container) => container.remove());
    };
  }, [placesLib]);

  return (
    <FormInput
      ref={inputRef}
      label={label}
      icon={MapPin}
      type="text"
      className="h-13"
      required
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode: AuthMode;
  onComplete: (role: UserRole, user: UserType) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode,
  onComplete,
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const renderContent = () => {
    switch (mode) {
      case "login":
        return (
          <LoginView onSwitch={(m) => setMode(m)} onComplete={onComplete} />
        );
      case "signup-parent":
        return (
          <ParentSignupView
            onSwitch={(m) => setMode(m)}
            onComplete={onComplete}
          />
        );
      case "signup-teacher":
        return (
          <TeacherSignupView
            onSwitch={(m) => setMode(m)}
            onComplete={onComplete}
          />
        );
      case "forgot-password":
        return <ForgotView onSwitch={(m) => setMode(m)} />;
      default:
        return null;
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-slate-ink/40 backdrop-blur-sm"
          />

          <motion.div
            key={mode}
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ duration: 0.4, ease: "circOut" }}
            className={cn(
              "relative bg-white w-full max-h-[95vh] overflow-y-auto card-rounded soft-shadow flex flex-col z-50",
              mode === "login" || mode === "forgot-password"
                ? "max-w-[500px]"
                : "max-w-[1200px]",
            )}
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors z-[60] bg-white/50 backdrop-blur-md rounded-full border border-slate-100"
            >
              <X size={20} />
            </button>

            {renderContent()}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// --- Login View ---
const LoginView = ({
  onSwitch,
  onComplete,
}: {
  onSwitch: (m: AuthMode) => void;
  onComplete: (role: UserRole, user: UserType) => void;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiService.login({ email, password });
      if (response.success && response.user) {
        if (response.token) {
          localStorage.setItem("auth_token", response.token);
        }
        setSuccess(response.message || t("auth.loginSuccess"));
        setTimeout(() => {
          // @ts-ignore
          onComplete(response.user.role, response.user);
        }, 1500);
      } else {
        setError(response.message || t("auth.loginFailed"));
      }
    } catch (err) {
      setError(t("auth.errorUnexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-10 md:p-14 justify-center">
      <div className="mb-6 md:mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="text-2xl font-bold tracking-tight text-brand-slate-ink">
            Bloom Buddies Academy
          </span> */}
          <img src={Logo} alt="Bloom Buddies Academy" className="w-84 h-auto pointer-events-none" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-slate-ink">
          {t("auth.welcome")}
        </h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
            <Sparkles size={16} />
            {success}
          </div>
        )}

        <FormInput
          label={t("auth.email")}
          icon={Mail}
          type="email"
          required
          className="h-13 text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
        />

        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              {t("auth.password")}
            </label>
            <button
              type="button"
              onClick={() => onSwitch("forgot-password")}
              className="text-[11px] font-bold text-brand-indigo hover:underline"
            >
              {t("auth.forgot")}
            </button>
          </div>
          <div className="relative group">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors"
              size={18}
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field !pl-14 h-13 text-base"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bloom-gradient text-white font-bold py-3 md:py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.01] active:scale-95 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("auth.loading")}
            </>
          ) : (
            t("auth.login")
          )}
        </button>
      </form>

      <div className="mt-2 md:mt-4 pt-8 border-t border-slate-100 flex flex-col items-center gap-4">
        <p className="text-sm text-slate-500">{t("auth.noAccount")}</p>
        <div className="flex gap-4">
          <button
            onClick={() => onSwitch("signup-parent")}
            className="text-xs font-bold text-brand-indigo bg-indigo-50 px-4 py-2 rounded-full hover:bg-brand-indigo hover:text-white transition-all capitalize"
          >
            {t("nav.signupParent")}
          </button>
          <button
            onClick={() => onSwitch("signup-teacher")}
            className="text-xs font-bold text-brand-purple bg-purple-50 px-4 py-2 rounded-full hover:bg-brand-purple hover:text-white transition-all capitalize"
          >
            {t("nav.signupTeacher")}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Forgot Password View ---
const ForgotView = ({ onSwitch }: { onSwitch: (m: AuthMode) => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiService.forgotPassword(email);
      if (response.success) {
        setSuccess(response.message || t("auth.checkEmail"));
      } else {
        setError(response.message || t("auth.failedResetLink"));
      }
    } catch (err) {
      setError(t("auth.errorUnexpected"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-10 md:p-14 justify-center">
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          {/* <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="text-2xl font-bold tracking-tight text-brand-slate-ink">
            {t("common.brandName")}
          </span> */}
          <img src={Logo} alt="Bloom Buddies Academy" className="w-84 h-auto transform -translate-x-2" />
        </div>
        <h2 className="text-3xl font-extrabold text-brand-slate-ink">
          {t("auth.forgot")}
        </h2>
        <p className="text-slate-500 mt-2">{t("auth.forgotDesc")}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2">
            <Sparkles size={16} />
            {success}
          </div>
        )}

        <FormInput
          label={t("auth.email")}
          icon={Mail}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="julie.jorgensen@gmail.com"
        />

        <button
          type="submit"
          disabled={loading || !!success}
          className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.01] active:scale-95 transition-all mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t("auth.loading")}
            </>
          ) : (
            t("auth.passwordResetLink")
          )}
        </button>
      </form>

      <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center">
        <button
          onClick={() => onSwitch("login")}
          className="flex items-center gap-2 text-sm font-bold text-brand-indigo hover:gap-3 transition-all"
        >
          <ChevronLeft size={16} />
          {t("auth.backToLogin")}
        </button>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────────────────────────
// ParentSignupView — 2-step multi-step form
//   Step 1: Personal details (left col → full width)
//   Step 2: Children schedule (right col → full width)
// ─────────────────────────────────────────────────────────────────────────────

const ParentSignupView = ({
  onSwitch,
  onComplete,
}: {
  onSwitch: (m: AuthMode) => void;
  onComplete: (role: UserRole, user: UserType) => void;
}) => {
  const { t } = useLanguage();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [parentFields, setParentFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
    countryCode: "+1",
    city: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [numChildren, setNumChildren] = useState(1);
  const [children, setChildren] = useState<ChildData[]>([
    { id: "1", dob: "", schedule: INITIAL_SCHEDULE },
  ]);
  const [activeChildIndex, setActiveChildIndex] = useState(0);

  // ── Validation ───────────────────────────────────────────────────────────────
  // Step 1 is valid when all personal fields are filled and passwords match
  const isStep1Valid =
    parentFields.firstName.trim() !== "" &&
    parentFields.lastName.trim() !== "" &&
    parentFields.email.trim() !== "" &&
    parentFields.password !== "" &&
    parentFields.password === parentFields.confirmPassword &&
    parentFields.telephone.trim() !== "" &&
    parentFields.city.trim() !== "";

  // Full form valid (step 1 + every child has a dob)
  const isFormValid = isStep1Valid && children.every((c) => c.dob);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const formattedChildren = children.map((child) => {
      const scheduleObj: Record<string, any> = {};
      child.schedule.forEach((day) => {
        scheduleObj[day.day.toLowerCase()] = day.slots.map((slot) => ({
          start: slot.startTime,
          end: slot.endTime,
        }));
      });
      return { dob: child.dob, schedule: scheduleObj };
    });

    const payload = {
      firstName: parentFields.firstName,
      lastName: parentFields.lastName,
      email: parentFields.email,
      password: parentFields.password,
      password_confirmation: parentFields.confirmPassword,
      telephone: parentFields.telephone.startsWith("+")
        ? parentFields.telephone
        : `+${parentFields.telephone}`,
      city: parentFields.city,
      children: formattedChildren,
    };

    try {
      const response = await apiService.signupParent(payload);
      const userData = response.user || (response as any).data;
      const isActuallySuccess =
        response.success === true ||
        response.message?.toLowerCase().includes("success");

      if (isActuallySuccess) {
        let token = response.token;
        let finalUser = userData;

        if (!token) {
          try {
            const loginRes = await apiService.login({
              email: parentFields.email,
              password: parentFields.password,
            });
            if (loginRes.success && loginRes.token) {
              token = loginRes.token;
              finalUser = loginRes.user || finalUser;
            }
          } catch (loginErr) {
            console.error("Auto-login failed after signup", loginErr);
          }
        }

        if (token) localStorage.setItem("auth_token", token);

        setSuccess(
          response.message ||
            (t("en") === "en"
              ? "Registration successful!"
              : "Inscription réussie !"),
        );
        setError(null);

        if (finalUser) {
          setTimeout(() => onComplete(finalUser.role, finalUser), 1200);
        }
      } else {
        if (response.errors) {
          const firstError = Object.values(response.errors)[0][0];
          setError(firstError);
        } else {
          setError(
            response.message ||
              (t("en") === "en"
                ? "Registration failed"
                : "Échec de l'inscription"),
          );
        }
        setSuccess(null);
      }
    } catch {
      setError(
        t("en") === "en"
          ? "An unexpected error occurred. Please try again."
          : "Une erreur inattendue est survenue. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Children helpers ─────────────────────────────────────────────────────────
  const handleNumChildrenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value);
    setNumChildren(val);
    setChildren((prev) => {
      if (val > prev.length) {
        const next = [...prev];
        for (let i = prev.length; i < val; i++) {
          next.push({ id: `${i + 1}`, dob: "", schedule: INITIAL_SCHEDULE });
        }
        return next;
      }
      return prev.slice(0, val);
    });
  };

  const updateChildField = (
    index: number,
    field: keyof ChildData,
    value: string,
  ) => {
    setChildren((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addTimeSlot = (dayName: string) => {
    setChildren((prev) => {
      const next = [...prev];
      const child = next[activeChildIndex];
      next[activeChildIndex] = {
        ...child,
        schedule: child.schedule.map((d) =>
          d.day === dayName
            ? {
                ...d,
                slots: [
                  ...d.slots,
                  {
                    id: Math.random().toString(36).substr(2, 9),
                    startTime: "",
                    endTime: "",
                  },
                ],
              }
            : d,
        ),
      };
      return next;
    });
  };

  const updateTimeSlot = (
    dayName: string,
    slotId: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setChildren((prev) => {
      const next = [...prev];
      const child = next[activeChildIndex];
      next[activeChildIndex] = {
        ...child,
        schedule: child.schedule.map((d) =>
          d.day === dayName
            ? {
                ...d,
                slots: d.slots.map((s) => {
                  if (s.id !== slotId) return s;
                  let nextSlot = { ...s, [field]: value };

                  if (field === "startTime" && value) {
                    const [h, m] = value.split(":").map(Number);
                    const nextH = (h + 1) % 24;
                    nextSlot.endTime = `${nextH.toString().padStart(2, "0")}:${m
                      .toString()
                      .padStart(2, "0")}`;
                  }

                  if (nextSlot.startTime && nextSlot.endTime) {
                    const [sh, sm] = nextSlot.startTime.split(":").map(Number);
                    const [eh, em] = nextSlot.endTime.split(":").map(Number);
                    const startMins = sh * 60 + sm;
                    const endMins = eh * 60 + em;
                    if (
                      endMins - startMins < 30 &&
                      endMins > startMins &&
                      field === "endTime"
                    ) {
                      const forceMins = startMins + 30;
                      nextSlot.endTime = `${Math.floor(forceMins / 60)
                        .toString()
                        .padStart(
                          2,
                          "0",
                        )}:${(forceMins % 60).toString().padStart(2, "0")}`;
                    }
                  }
                  return nextSlot;
                }),
              }
            : d,
        ),
      };
      return next;
    });
  };

  const removeTimeSlot = (dayName: string, slotId: string) => {
    setChildren((prev) => {
      const next = [...prev];
      const child = next[activeChildIndex];
      next[activeChildIndex] = {
        ...child,
        schedule: child.schedule.map((d) =>
          d.day === dayName
            ? { ...d, slots: d.slots.filter((s) => s.id !== slotId) }
            : d,
        ),
      };
      return next;
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* ── Header + Step Indicator ─────────────────────────────────────────── */}
      <div className="shrink-0 px-8 md:px-12 pt-8 pb-2 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-5">
          {/* <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-slate-ink">
            Bloom Buddies Academy
          </span> */}
          <img src={Logo} alt="Bloom Buddies Academy" className="w-84 h-auto transform -translate-x-2" />
        </div>

        <div className="flex items-center gap-4 sm:w-1/2 mx-auto">
          {/* Step 1 pill */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all",
                step === 1
                  ? "bloom-gradient text-white shadow-lg shadow-indigo-200"
                  : "bg-emerald-500 text-white",
              )}
            >
              {step > 1 ? <Check size={14} /> : "1"}
            </div>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors",
                step === 1 ? "text-brand-indigo" : "text-emerald-600",
              )}
            >
              {/* {t("auth.yourDetails")} */}
            </span>
          </div>

          {/* Connector line */}
          <div className="flex-1 h-px bg-slate-200 relative">
            <div
              className={cn(
                "absolute inset-y-0 left-0 bg-emerald-400 transition-all duration-500",
                step > 1 ? "w-full" : "w-0",
              )}
            />
          </div>

          {/* Step 2 pill */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all",
                step === 2
                  ? "bloom-gradient text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-200 text-slate-400",
              )}
            >
              2
            </div>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors",
                step === 2 ? "text-brand-indigo" : "text-slate-400",
              )}
            >
              {/* {t("auth.childrenSchedule")} */}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <div className="px-8 md:px-12 py-6">
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-brand-slate-ink">
                {t("auth.registration")}
              </h2>
              <p className="text-slate-500 mt-1">{t("nav.iamaParent")}</p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <FormInput
                  label={t("auth.firstName")}
                  icon={UserIcon}
                  type="text"
                  className="h-13"
                  required
                  placeholder="Julie"
                  value={parentFields.firstName}
                  onChange={(e) =>
                    setParentFields((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
                <FormInput
                  label={t("auth.lastName")}
                  icon={UserIcon}
                  type="text"
                  required
                  className="h-13"
                  placeholder="Jorgensen"
                  value={parentFields.lastName}
                  onChange={(e) =>
                    setParentFields((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                />
              </div>

              <FormInput
                label={t("auth.email")}
                icon={Mail}
                type="email"
                className="h-13"
                required
                placeholder="Julie.Jorgensen@gmail.com"
                value={parentFields.email}
                onChange={(e) =>
                  setParentFields((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <FormInput
                  label={t("auth.password")}
                  icon={Lock}
                  type="password"
                  className="h-13"
                  required
                  placeholder="••••••••"
                  value={parentFields.password}
                  onChange={(e) =>
                    setParentFields((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                />
                <FormInput
                  label={t("auth.confirmPassword")}
                  icon={Lock}
                  type="password"
                  className="h-13"
                  required
                  placeholder="••••••••"
                  value={parentFields.confirmPassword}
                  onChange={(e) =>
                    setParentFields((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Password mismatch hint */}
              {parentFields.password !== parentFields.confirmPassword && (
                <p className="text-[11px] text-red-500 font-bold ml-1 -mt-4">
                  {t("auth.passwordMatch")}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {t("auth.telephone")}
                  </label>

                  <PhoneInput
                    country={"fr"}
                    enableSearch={true}
                    value={parentFields.telephone}
                    onChange={(phone) =>
                      setParentFields((prev) => ({
                        ...prev,
                        telephone: phone.startsWith("+") ? phone : `+${phone}`,
                      }))
                    }
                    inputClass="!w-full !h-13 !rounded-2xl !border !border-slate-300 !pl-14"
                    buttonClass="!border-none !bg-transparent"
                    containerClass="!w-full"
                    dropdownClass="!fixed !z-[9999]"
                  />
                </div>

                <CityAutocomplete
                  label={t("auth.city")}
                  placeholder="Paris"
                  value={parentFields.city}
                  onChange={(val) =>
                    setParentFields((prev) => ({ ...prev, city: val }))
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <div className="px-8 md:px-12 py-8">
            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-brand-slate-ink">
                {t("auth.registration")}
              </h2>
              <p className="text-slate-500 mt-1">{t("nav.iamaParent")}</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake mb-6">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2 mb-6">
                <Sparkles size={16} />
                {success}
              </div>
            )}

            {/* Number of children */}
            <div className="mb-6">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                {t("auth.number-of-students")}
              </label>
              <select
                value={numChildren}
                onChange={handleNumChildrenChange}
                className="input-field h-14 mt-2"
              >

                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}{" "}
                    {n === 1
                      ? t("class.student")
                      : t("class.students")}
                  </option>
                ))}
              </select>
            </div>

            {/* Child DOBs */}
            {/* Child DOBs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {children.map((child, idx) => (
                <div
                  key={child.id}
                  className="p-4 bg-white rounded-2xl soft-shadow border border-slate-100"
                >
                  <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono block mb-2">
                    {t("class.student")} {idx + 1}
                  </label>
                  <div className="relative group">
                    <CalendarIcon
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors"
                      size={14}
                    />
                    <input
                      type="date"
                      value={child.dob}
                      onChange={(e) =>
                        updateChildField(idx, "dob", e.target.value)
                      }
                      className="input-field h-10 text-xs bg-slate-50 border-transparent focus:bg-white !pl-9 w-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Child tabs + schedule */}
            <div className="flex bg-slate-100 p-1 rounded-full overflow-x-auto no-scrollbar mb-6 w-fit">
              {children.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveChildIndex(idx)}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap capitalize",
                    activeChildIndex === idx ? "tab-active" : "tab-inactive",
                  )}
                >
                  {t("class.student")} {idx + 1}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {children[activeChildIndex].schedule.map((day) => (
                <div
                  key={day.day}
                  className="p-5 rounded-2xl bg-slate-50/50 border border-indigo-200 transition-all hover:bg-white hover:soft-shadow hover:border-brand-indigo/20 group"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">
                      {t(`days.${day.day}`)}
                    </span>
                    <button
                      onClick={() => addTimeSlot(day.day)}
                      className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-slate-500 text-white bg-indigo-500 hover:border-brand-indigo hover:shadow-lg hover:shadow-indigo-50 transition-all font-bold text-[11px] uppercase tracking-wider"
                    >
                      <Plus size={14} /> {t("auth.addSlot")}
                    </button>
                  </div>

                  <div className="flex wrap items-center gap-3">
                    {day.slots.length === 0 ? (
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-widest italic">
                        {/* {t("auth.noSlots")} */}
                      </div>
                    ) : (
                      day.slots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-3 bg-white border border-slate-200 p-2 pl-4 pr-2 rounded-lg soft-shadow-sm hover:border-brand-indigo/30 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-700 tracking-widest leading-none">
                                {t("auth.start")}
                              </p>
                              <input
                                type="time"
                                value={slot.startTime}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day.day,
                                    slot.id,
                                    "startTime",
                                    e.target.value,
                                  )
                                }
                                className="bg-transparent text-xs font-bold text-brand-indigo outline-none cursor-pointer"
                              />
                            </div>
                            <div className="w-4 h-px bg-slate-100" />
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-slate-700 tracking-widest leading-none">
                                {t("auth.end")}
                              </p>
                              <input
                                type="time"
                                value={slot.endTime}
                                onChange={(e) =>
                                  updateTimeSlot(
                                    day.day,
                                    slot.id,
                                    "endTime",
                                    e.target.value,
                                  )
                                }
                                className="bg-transparent text-xs font-bold text-brand-indigo outline-none cursor-pointer"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(day.day, slot.id)}
                            className="p-2 bg-red-200 text-red-400 hover:text-white hover:bg-red-500 rounded-md transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Footer ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-6 md:px-12 py-4 md:py-6 border-t border-slate-100 bg-white flex flex-col items-center gap-3 md:gap-4">
        {step === 1 ? (
          <>
            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full bloom-gradient text-white font-bold py-4 md:py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:grayscale flex items-center justify-center gap-2"
            >
              {t("auth.continue")}
              <ChevronRight size={20} />
            </button>
            <p className="text-sm text-slate-400 pb-1">
              {t("auth.alreadyAccount")}{" "}
              <button
                type="button"
                onClick={() => onSwitch("login")}
                className="text-brand-indigo font-bold hover:underline"
              >
                {t("auth.login")}
              </button>
            </p>
          </>
        ) : (
          <>
            <form
              id="parent-signup-form"
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full bloom-gradient text-white font-bold py-4 md:py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:grayscale flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("auth.loading")}
                  </>
                ) : (
                  t("nav.signup")
                )}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={16} />
              {t("auth.back")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TeacherSignupView — 2-step multi-step form
//   Step 1: Personal details + About Me (left col → full width)
//   Step 2: Weekly availability grid (right col → full width)
// ─────────────────────────────────────────────────────────────────────────────

const TeacherSignupView = ({
  onSwitch,
  onComplete,
}: {
  onSwitch: (m: AuthMode) => void;
  onComplete: (role: UserRole, user: UserType) => void;
}) => {
  const { t } = useLanguage();

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2>(1);

  // ── Form fields ─────────────────────────────────────────────────────────────
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    telephone: "",
    countryCode: "+1",
    dob: "",
    city: "",
    timezone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [aboutMe, setAboutMe] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<"add" | "remove">("add");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Validation ───────────────────────────────────────────────────────────────
  const isStep1Valid =
    fields.firstName.trim() !== "" &&
    fields.lastName.trim() !== "" &&
    fields.email.trim() !== "" &&
    fields.password !== "" &&
    fields.password === fields.confirmPassword &&
    fields.telephone.trim() !== "" &&
    fields.dob !== "" &&
    fields.city.trim() !== "" &&
    fields.timezone !== "" &&
    aboutMe.length >= 250;

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const schedule: any[] = Array.from(selectedSlots).map((slotId: string) => {
      const [day, timeRange] = slotId.split(":::");
      const [startH, endH] = timeRange.split("h - ");
      return {
        day: day.toLowerCase(),
        start: `${startH}:00`,
        end: `${endH.replace("h", "")}:00`,
      };
    });

    const payload = {
      firstName: fields.firstName,
      lastName: fields.lastName,
      email: fields.email,
      password: fields.password,
      password_confirmation: fields.confirmPassword,
      telephone: fields.telephone.startsWith("+")
        ? fields.telephone
        : `+${fields.telephone}`,
      dob: fields.dob,
      city: fields.city,
      timezone: fields.timezone,
      about_me: aboutMe,
      schedule,
    };

    try {
      const response = await apiService.signupTeacher(payload);
      const userData = response.user || (response as any).data;
      const isActuallySuccess =
        response.success === true ||
        response.message?.toLowerCase().includes("success");

      if (isActuallySuccess) {
        let token = response.token;
        let finalUser = userData;

        if (!token) {
          try {
            const loginRes = await apiService.login({
              email: fields.email,
              password: fields.password,
            });
            if (loginRes.success && loginRes.token) {
              token = loginRes.token;
              finalUser = loginRes.user || finalUser;
            }
          } catch (loginErr) {
            console.error("Auto-login failed after signup", loginErr);
          }
        }

        if (token) localStorage.setItem("auth_token", token);

        setSuccess(
          response.message ||
            (t("en") === "en"
              ? "Registration successful!"
              : "Inscription réussie !"),
        );
        setError(null);

        if (finalUser) {
          setTimeout(() => onComplete(finalUser.role, finalUser), 1200);
        }
      } else {
        if (response.errors) {
          const firstError = Object.values(response.errors)[0][0];
          setError(firstError);
        } else {
          setError(
            response.message ||
              (t("en") === "en"
                ? "Registration failed"
                : "Échec de l'inscription"),
          );
        }
        setSuccess(null);
      }
    } catch {
      setError(
        t("en") === "en"
          ? "An unexpected error occurred. Please try again."
          : "Une erreur inattendue est survenue. Veuillez réessayer.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Schedule helpers ─────────────────────────────────────────────────────────
  const toggleSlot = (id: string, forceAction?: "add" | "remove") => {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      const action = forceAction || (next.has(id) ? "remove" : "add");
      if (action === "add") next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleMouseDown = (id: string) => {
    setIsDragging(true);
    const action = selectedSlots.has(id) ? "remove" : "add";
    setDragAction(action);
    toggleSlot(id, action);
  };

  const handleMouseEnter = (id: string) => {
    if (isDragging) toggleSlot(id, dragAction);
  };

  const handleMouseUp = () => setIsDragging(false);

  // const handleCitySelected = (place: google.maps.places.PlaceResult) => {
  //   if (!place.address_components) return;

  //   // Auto-select timezone based on country or state
  //   const country = place.address_components.find((c) =>
  //     c.types.includes("country"),
  //   )?.short_name;

  //   let guessedTimezone = "";

  //   switch (country) {
  //     case "PK":
  //       guessedTimezone = "PKT";
  //       break;
  //     case "IN":
  //       guessedTimezone = "IST";
  //       break;
  //     case "JP":
  //       guessedTimezone = "JST";
  //       break;
  //     case "AU":
  //       guessedTimezone = "AEST";
  //       break;
  //     case "GB":
  //       guessedTimezone = "BST";
  //       break;
  //     case "FR":
  //     case "DE":
  //     case "IT":
  //     case "ES":
  //     case "NL":
  //     case "BE":
  //       guessedTimezone = "CET";
  //       break;
  //     case "US":
  //     case "CA":
  //       // Check for Eastern timezone states/provinces (simplified)
  //       const state = place.address_components.find((c) =>
  //         c.types.includes("administrative_area_level_1"),
  //       )?.short_name;
  //       const estStates = [
  //         "NY",
  //         "FL",
  //         "PA",
  //         "OH",
  //         "GA",
  //         "NC",
  //         "MI",
  //         "VA",
  //         "NJ",
  //         "MA",
  //         "ON",
  //         "QC",
  //       ];
  //       if (state && estStates.includes(state)) {
  //         guessedTimezone = "EST";
  //       }
  //       break;
  //   }

  //   if (guessedTimezone) {
  //     setFields((prev) => ({ ...prev, timezone: guessedTimezone }));
  //   }
  // };

  // ── Render ───────────────────────────────────────────────────────────────────

  // @ts-ignore
  const handleCitySelected = (place: google.maps.places.PlaceResult) => {
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();

    if (lat == null || lng == null) return;

    const timezone = tzlookup(lat, lng);

    setFields((prev) => ({
      ...prev,
      timezone,
    }));
  };
  return (
    <div className="flex flex-col h-full" onMouseUp={handleMouseUp}>
      {/* ── Header + Step Indicator ─────────────────────────────────────────── */}
      <div className="shrink-0 px-8 md:px-12 pt-8 pb-6 bg-slate-50/50 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-5">
          {/* <div className="w-10 h-10 bloom-gradient rounded-xl flex items-center justify-center text-white font-bold">
            B
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-slate-ink">
            Bloom Buddies Academy
          </span> */}
          <img src={Logo} alt="Bloom Buddies Academy" className="w-84 h-auto transform -translate-x-2" />
        </div>

        <div className="flex items-center gap-4 sm:w-1/2 mx-auto">
          {/* Step 1 pill */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all",
                step === 1
                  ? "bloom-gradient text-white shadow-lg shadow-indigo-200"
                  : "bg-emerald-500 text-white",
              )}
            >
              {step > 1 ? <Check size={14} /> : "1"}
            </div>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors",
                step === 1 ? "text-brand-indigo" : "text-emerald-600",
              )}
            >
              {/* {t("auth.yourProfile")} */}
            </span>
          </div>

          {/* Connector line */}
          <div className="flex-1 h-px bg-slate-200 relative">
            <div
              className={cn(
                "absolute inset-y-0 left-0 bg-emerald-400 transition-all duration-500",
                step > 1 ? "w-full" : "w-0",
              )}
            />
          </div>

          {/* Step 2 pill */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all",
                step === 2
                  ? "bloom-gradient text-white shadow-lg shadow-indigo-200"
                  : "bg-slate-200 text-slate-400",
              )}
            >
              2
            </div>
            <span
              className={cn(
                "text-xs font-bold uppercase tracking-widest transition-colors",
                step === 2 ? "text-brand-indigo" : "text-slate-400",
              )}
            >
              {/* {t("auth.availability")} */}
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable Body ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* ════════════════ STEP 1 ════════════════ */}
        {step === 1 && (
          <div className="px-8 md:px-12 py-8">
            <div className="mb-4">
              <h2 className="text-3xl font-extrabold text-brand-slate-ink">
                {t("auth.registration")}
              </h2>
              <p className="text-slate-500 mt-1">{t("nav.iamaTeacher")}</p>
            </div>

            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-bold border border-red-100 animate-shake">
                  {error}
                </div>
              )}

              {/* Profile photo */}
              <div className="flex flex-col items-center mb-8 gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t("auth.profilePhoto")}
                </p>
                <div className="relative group">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-[2.5rem] bg-white soft-shadow flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden group-hover:border-brand-purple transition-all cursor-pointer"
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="text-slate-200" size={40} />
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-purple text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-all"
                  >
                    <Plus size={20} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () =>
                          setProfilePic(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <FormInput
                  label={t("auth.firstName")}
                  icon={UserIcon}
                  type="text"
                  required
                  placeholder="Julie"
                  value={fields.firstName}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
                <FormInput
                  label={t("auth.lastName")}
                  icon={UserIcon}
                  type="text"
                  required
                  placeholder="Jorgensen"
                  value={fields.lastName}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>

              <FormInput
                label={t("auth.email")}
                icon={Mail}
                type="email"
                required
                placeholder="Julie.Jorgensen@gmail.com"
                value={fields.email}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, email: e.target.value }))
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <FormInput
                  label={t("auth.password")}
                  icon={Lock}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={fields.password}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, password: e.target.value }))
                  }
                />
                <FormInput
                  label={t("auth.confirmPassword")}
                  icon={Lock}
                  type="password"
                  required
                  placeholder="••••••••"
                  value={fields.confirmPassword}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Password mismatch hint */}
              {fields.password !== fields.confirmPassword && (
                <p className="text-[11px] text-red-500 font-bold ml-1 -mt-4">
                  {t("auth.passwordMatch")}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {t("auth.telephone")}
                  </label>

                  <PhoneInput
                    country={"gb"}
                    enableSearch={true}
                    value={fields.telephone}
                    onChange={(phone) =>
                      setFields((prev) => ({
                        ...prev,
                        telephone: phone.startsWith("+") ? phone : `+${phone}`,
                      }))
                    }
                    inputClass="!w-full !h-14 !rounded-2xl !border !border-slate-300 !pl-14 text-base"
                    buttonClass="!border-none !bg-transparent"
                    containerClass="!w-full"
                  />
                </div>

                <FormInput
                  label={t("auth.whatIsYourDOB")}
                  icon={CalendarIcon}
                  type="date"
                  required
                  value={fields.dob}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, dob: e.target.value }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <CityAutocomplete
                  label={t("auth.wheredoyoulive")}
                  placeholder="San Francisco"
                  value={fields.city}
                  onChange={(val) =>
                    setFields((prev) => ({ ...prev, city: val }))
                  }
                  onPlaceSelected={handleCitySelected}
                />
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                    {t("auth.timezone")}
                  </label>
                  <div className="relative group">
                    <Globe
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-indigo transition-colors pointer-events-none"
                      size={18}
                    />
                    <select
                      required
                      disabled={true}
                      className="input-field h-14 !pl-14 cursor-pointer appearance-none bg-white font-medium"
                      name="timezone"
                      value={fields.timezone}
                      onChange={(e) =>
                        setFields((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                    >
                      <option value="">{t("auth.selectTimezone")}</option>

                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* About Me */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    {t("auth.aboutMe")}
                  </label>
                  <span
                    className={cn(
                      "text-[10px] font-bold",
                      aboutMe.length >= 250
                        ? "text-emerald-500"
                        : "text-amber-500",
                    )}
                  >
                    {aboutMe.length}/350
                  </span>
                </div>
                <textarea
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value.slice(0, 350))}
                  required
                  className="input-field h-40 resize-none py-4 leading-relaxed"
                  placeholder={t("auth.aboutMePlaceholder")}
                />
                {aboutMe.length < 250 && (
                  <p className="text-[10px] text-amber-500 font-bold ml-1 font-mono uppercase">
                    {t("auth.aboutMeMin")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════ STEP 2 ════════════════ */}
        {step === 2 && (
          <div className="px-8 md:px-12 py-8 select-none">
            <div className="mb-6">
              <h2 className="text-3xl font-extrabold text-brand-slate-ink">
                {t("auth.registration")}
              </h2>
              <p className="text-slate-500 mt-1">{t("nav.iamaTeacher")}</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-sm font-bold border border-red-100 animate-shake mb-6">
                {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-bold border border-emerald-100 flex items-center gap-2 mb-6">
                <Sparkles size={16} />
                {success}
              </div>
            )}

            <label className="text-[11px] font-bold mb-2 text-slate-400 uppercase tracking-widest">
              {t("class.whatisyouravailabilitytoteach")}
            </label>

            <div className="border border-slate-100 rounded-3xl bg-slate-50/30 overflow-auto">
              <table className="w-full border-separate border-spacing-1 min-w-[700px]">
                <thead className="sticky top-0 z-20 bg-white">
                  <tr>
                    <th className="w-24 sticky left-0 z-30 bg-white border-r border-slate-100" />
                    {DAYS.map((day) => (
                      <th
                        key={day}
                        className="py-4 px-1 text-center font-extrabold text-[10px] text-slate-400 uppercase tracking-widest min-w-[90px] border-b border-slate-100"
                      >
                        {t(`days.${day}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time) => (
                    <tr key={time}>
                      <td className="w-24 sticky left-0 z-10 bg-white/95 backdrop-blur-md pr-4 text-right border-r border-slate-100/50">
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                          {time}
                        </span>
                      </td>
                      {DAYS.map((day) => {
                        const id = `${day}:::${time}`;
                        const isSelected = selectedSlots.has(id);
                        return (
                          <td
                            key={day}
                            onMouseDown={() => handleMouseDown(id)}
                            onMouseEnter={() => handleMouseEnter(id)}
                            className={cn(
                              "h-10 rounded-xl cursor-pointer transition-all duration-300 border relative overflow-hidden",
                              isSelected
                                ? "bg-emerald-500 border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                                : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200",
                            )}
                          >
                            {isSelected && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">
                                  {t("auth.available")}
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                type="button"
                onClick={() => setSelectedSlots(new Set())}
                className="text-xs font-bold text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest"
              >
                {t("auth.clearSelection")}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {selectedSlots.size} {t("auth.slotsSelected")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Footer ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 md:px-12 py-6 border-t border-slate-100 bg-white flex flex-col items-center gap-4">
        {step === 1 ? (
          <>
            <button
              onClick={() => setStep(2)}
              disabled={!isStep1Valid}
              className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-indigo-100 text-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 disabled:grayscale flex items-center justify-center gap-2"
            >
              {t("auth.continue")}
              <ChevronRight size={20} />
            </button>
            <p className="text-sm text-slate-400 pb-1">
              {t("auth.alreadyAccount")}{" "}
              <button
                type="button"
                onClick={() => onSwitch("login")}
                className="text-brand-indigo font-bold hover:underline"
              >
                {t("auth.login")}
              </button>
            </p>
          </>
        ) : (
          <>
            <form
              id="teacher-signup-form"
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-4"
            >
              <button
                type="submit"
                disabled={loading || selectedSlots.size === 0}
                className="w-full bloom-gradient text-white font-bold py-5 rounded-2xl shadow-xl shadow-emerald-100/50 text-lg transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t("auth.loading")}
                  </>
                ) : (
                  t("nav.signup")
                )}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm font-bold text-slate-400 hover:text-slate-800 transition-colors"
            >
              <ChevronLeft size={16} />
              {t("auth.back")}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
