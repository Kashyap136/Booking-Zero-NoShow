import { api, toApiError } from "./api";

export interface Company {
  id: string;
  name?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  companyId?: string;
  company?: Company;
}

export interface Session {
  token: string;
  user: User;
  companyId: string;
}

type Listener = () => void;

const AUTH_KEY = "booking-auth";
let cache: Session | null | undefined;
const listeners = new Set<Listener>();

function emit() {
  for (const cb of [...listeners]) cb();
}

function load(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    return parsed?.token ? parsed : null;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  if (cache === undefined) cache = load();
  return cache;
}

export function getCompanyId(): string {
  return getSession()?.companyId ?? "";
}

export function isAuthenticated(): boolean {
  return !!getSession();
}

export function isAdmin(): boolean {
  return getSession()?.user?.role?.toLowerCase() === "admin";
}

export function subscribe(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function setSession(session: Session | null) {
  cache = session;
  if (session) localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  else localStorage.removeItem(AUTH_KEY);
  emit();
}

export async function signIn(
  email: string,
  password: string,
): Promise<Session> {
  try {
    const res = await api.post<{
      token?: string;
      user?: User;
      company?: Company;
    }>("/api/auth/login", { email, password });
    const d = res.data;
    const token = d.token ?? "";
    const user = d.user ?? ({ id: "", email } as User);
    const companyId =
      user.companyId ?? user.company?.id ?? "";
    const session: Session = { token, user, companyId };
    setSession(session);
    return session;
  } catch (err) {
    throw toApiError(err);
  }
}

export async function register(
  name: string,
  email: string,
  phone: string,
  password: string,
): Promise<Session> {
  try {
    const res = await api.post<{
      token?: string;
      user?: User;
      company?: Company;
    }>("/api/auth/register", { name, email, phone, password });
    const d = res.data;
    const token = d.token ?? "";
    const user = d.user ?? ({ id: "", name, email } as User);
    const companyId =
      user.companyId ?? user.company?.id ?? "";
    const session: Session = { token, user, companyId };
    setSession(session);
    return session;
  } catch (err) {
    throw toApiError(err);
  }
}

export function logout() {
  setSession(null);
  if (typeof window !== "undefined") {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }
}