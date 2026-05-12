import { Router } from "express";
import { createSupabaseUserClient } from "../services/supabaseClient.js";

export const authRoutes = Router();

authRoutes.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const session = data.session;
  return res.status(201).json({
    message: session
      ? "Registered and signed in"
      : "Registered — confirm email if your project requires it",
    access_token: session?.access_token || null,
    refresh_token: session?.refresh_token || null,
    user: data.user
      ? { id: data.user.id, email: data.user.email }
      : null,
  });
});

authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const supabase = createSupabaseUserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  const session = data.session;
  if (!session) {
    return res.status(401).json({ error: "No active session returned" });
  }

  return res.json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
  });
});
