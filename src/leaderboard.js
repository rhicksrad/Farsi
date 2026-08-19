const LOCAL_KEY = "wordfall-leaderboard";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

async function request(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Leaderboard request failed (${response.status}).`);
  if (response.status === 204) return null;
  return response.json();
}

function normalizeScores(scores) {
  return scores
    .filter((entry) => /^[A-Z0-9]{3}$/.test(entry.initials) && Number.isFinite(entry.score))
    .sort((a, b) => b.score - a.score || a.initials.localeCompare(b.initials))
    .slice(0, 10);
}

function readLocal() {
  try {
    return normalizeScores(JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

function saveLocal(entry) {
  const scores = normalizeScores([...readLocal(), entry]);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(scores));
  return scores;
}

export async function getTopScores() {
  if (!supabaseConfigured) return readLocal();
  try {
    const data = await request("leaderboard_scores?select=initials,score&order=score.desc,created_at.asc&limit=10");
    return normalizeScores(data);
  } catch (error) {
    console.warn("Online leaderboard unavailable; showing local scores.", error);
    return readLocal();
  }
}

export async function submitScore(initials, score, difficulty, direction) {
  const entry = { initials: initials.trim().toUpperCase(), score: Math.max(0, Math.floor(score)) };
  if (!/^[A-Z0-9]{3}$/.test(entry.initials)) throw new Error("Enter exactly 3 letters or numbers.");
  if (!supabaseConfigured) return saveLocal(entry);

  await request("leaderboard_scores", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ ...entry, difficulty, direction }),
  });
  return getTopScores();
}

export function isOnlineLeaderboardConfigured() {
  return supabaseConfigured;
}
