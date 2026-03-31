import React, { useState, useEffect, useRef } from "react";
import {
  auth,
  db,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  increment,
  serverTimestamp,
  onAuthStateChanged,
  getDoc,
  setDoc,
  where,
  signInWithPopup,
  googleProvider,
  signOut,
} from "./firebase";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Send,
  Plus,
  X,
  Globe,
  Lock,
  Trash2,
  ChevronLeft,
  LogOut,
  Edit3,
  Check,
  Eye,
  ArrowRight,
  Zap,
  Feather,
  Bookmark,
  Search,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ADJECTIVES = [
  "Silent",
  "Hidden",
  "Mystic",
  "Ethereal",
  "Vibrant",
  "Dark",
  "Golden",
  "Swift",
  "Calm",
  "Wild",
];
const NOUNS = [
  "Shadow",
  "Echo",
  "Diary",
  "Spirit",
  "Ghost",
  "Phoenix",
  "Raven",
  "Wolf",
  "Storm",
  "Breeze",
];
const generateRandomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${NOUNS[Math.floor(Math.random() * NOUNS.length)]}${Math.floor(Math.random() * 999)}`;

async function hashEmail(email: string) {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email.toLowerCase().trim()),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface Secret {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isPrivate: boolean;
}
interface Comment {
  id: string;
  content: string;
  authorId: string;
  createdAt: any;
}
type View = "feed" | "vault";
type SortBy = "latest" | "popular" | "trending";
enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

function handleFirestoreError(
  e: unknown,
  op: OperationType,
  path: string | null,
) {
  const info = {
    error: e instanceof Error ? e.message : String(e),
    op,
    path,
    uid: auth.currentUser?.uid,
  };
  console.error("Firestore Error:", JSON.stringify(info));
  throw new Error(JSON.stringify(info));
}

/* ─── CSS ─── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#08080f;--s1:#0d0d1a;--s2:#111122;--s3:#161628;
  --b1:rgba(255,255,255,0.06);--b2:rgba(255,255,255,0.12);--b3:rgba(255,255,255,0.18);
  --t1:#eeeef8;--t2:rgba(238,238,248,0.55);--t3:rgba(238,238,248,0.28);
  --v:#8b5cf6;--v2:#6d28d9;--v3:rgba(139,92,246,0.15);
  --pk:#f472b6;--pk2:rgba(244,114,182,0.15);
  --gd:#fbbf24;--gd2:rgba(251,191,36,0.12);
  --r:14px;--rl:22px;--rxl:28px;
}
html,body{background:var(--bg);color:var(--t1);font-family:'Geist',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.serif{font-family:'Instrument Serif',Georgia,serif}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes up{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fd{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
@keyframes drift{from{transform:translate(0,0) scale(1)}to{transform:translate(24px,-16px) scale(1.04)}}
.modal-sheet{animation:up 0.28s cubic-bezier(0.32,0.72,0,1)}
.fade-in{animation:fd 0.18s ease forwards}
.blob{position:absolute;border-radius:50%;filter:blur(80px);animation:drift 14s ease-in-out infinite alternate;pointer-events:none}
.card{background:var(--s1);border:1px solid var(--b1);border-radius:var(--rl);transition:border-color 0.2s,transform 0.2s;cursor:pointer}
.card:hover{border-color:rgba(139,92,246,0.3);transform:translateY(-1px)}
.card:active{transform:translateY(0)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;padding:9px 18px;border-radius:var(--r);font-size:13px;font-weight:500;transition:all 0.15s;cursor:pointer;border:none;outline:none;font-family:'Geist',system-ui,sans-serif}
.btn-v{background:linear-gradient(135deg,var(--v),var(--v2));color:#fff;box-shadow:0 2px 18px rgba(109,40,217,0.28)}
.btn-v:hover{box-shadow:0 4px 26px rgba(109,40,217,0.42);transform:translateY(-1px)}
.btn-v:disabled{opacity:0.4;transform:none;box-shadow:none;cursor:not-allowed}
.btn-ghost{background:transparent;color:var(--t2);border:1px solid var(--b1)}
.btn-ghost:hover{background:rgba(255,255,255,0.05);color:var(--t1);border-color:var(--b2)}
.btn-ico{width:34px;height:34px;padding:0;border-radius:var(--r);background:transparent;color:var(--t3);border:1px solid var(--b1);cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;transition:all 0.15s}
.btn-ico:hover{background:rgba(255,255,255,0.06);color:var(--t2);border-color:var(--b2)}
.glass{background:rgba(255,255,255,0.04);border:1px solid var(--b1);backdrop-filter:blur(20px)}
.glass-deep{background:rgba(8,8,15,0.85);border:1px solid var(--b2);backdrop-filter:blur(40px)}
.input{background:var(--s2);border:1px solid var(--b1);border-radius:var(--r);color:var(--t1);font-family:'Geist',system-ui,sans-serif;font-size:14px;padding:9px 14px;outline:none;width:100%;transition:border-color 0.2s}
.input:focus{border-color:var(--v)}
.input::placeholder{color:var(--t3)}
textarea.compose{background:transparent;border:none;outline:none;resize:none;color:var(--t1);width:100%;font-size:18px;line-height:1.65;font-family:'Instrument Serif',Georgia,serif;font-style:italic}
textarea.compose::placeholder{color:var(--t3);font-style:italic}
.pill{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:500}
.pill-v{background:var(--v3);color:var(--v);border:1px solid rgba(139,92,246,0.25)}
.pill-pk{background:var(--pk2);color:var(--pk);border:1px solid rgba(244,114,182,0.25)}
.pill-gd{background:var(--gd2);color:var(--gd);border:1px solid rgba(251,191,36,0.2)}
.stat{display:flex;align-items:center;gap:5px;color:var(--t3);font-size:13px;transition:color 0.15s;background:none;border:none;cursor:pointer;font-family:inherit;padding:0}
.stat:hover{color:var(--t2)}
.stat.liked{color:var(--pk)}
.stat.liked svg{fill:var(--pk)}
.avatar{border-radius:10px;background:linear-gradient(135deg,rgba(109,40,217,0.4),rgba(244,114,182,0.25));border:1px solid rgba(139,92,246,0.28);display:flex;align-items:center;justify-content:center;font-weight:600;color:var(--v);flex-shrink:0}
.tab{padding:5px 13px;border-radius:100px;font-size:13px;font-weight:500;color:var(--t3);cursor:pointer;transition:all 0.15s;border:1px solid transparent;background:none;font-family:inherit;display:inline-flex;align-items:center;gap:5px}
.tab:hover{color:var(--t2)}
.tab.on{color:var(--t1);background:var(--s3);border-color:var(--b2)}
.bottom-nav{position:fixed;bottom:0;left:0;right:0;z-index:40;background:rgba(8,8,15,0.92);backdrop-filter:blur(32px);border-top:1px solid var(--b1)}
.modal-bg{position:fixed;inset:0;z-index:50;background:rgba(0,0,0,0.82);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center}
@media(min-width:640px){.modal-bg{align-items:center}}
.modal-sheet{width:100%;max-width:560px;background:var(--s1);border:1px solid var(--b2);border-radius:var(--rxl) var(--rxl) 0 0;overflow:hidden}
@media(min-width:640px){.modal-sheet{border-radius:var(--rxl);max-height:90vh}}
.drag{width:36px;height:4px;background:rgba(255,255,255,0.12);border-radius:2px;margin:10px auto 4px}
.search-bar{display:flex;align-items:center;gap:8px;background:var(--s2);border:1px solid var(--b1);border-radius:100px;padding:7px 14px;transition:border-color 0.2s;flex:1}
.search-bar:focus-within{border-color:var(--v)}
.search-bar input{background:transparent;border:none;outline:none;color:var(--t1);font-size:13px;flex:1;font-family:'Geist',system-ui,sans-serif}
.search-bar input::placeholder{color:var(--t3)}
.ql{border-left:2px solid rgba(139,92,246,0.18);padding-left:14px;transition:border-color 0.2s}
.card:hover .ql{border-left-color:rgba(139,92,246,0.35)}
.dropdown{position:fixed;top:65px;right:14px;width:252px;z-index:60;background:var(--s2);border:1px solid var(--b2);border-radius:var(--rl);box-shadow:0 16px 48px rgba(0,0,0,0.65);overflow:hidden}
.dropdown.fade-in{animation:fd 0.15s ease}
.stat-card{background:var(--s1);border:1px solid var(--b1);border-radius:var(--r);padding:14px 16px}
`;

/* ─── LANDING ─── */
function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{CSS}</style>
      <div
        className="blob"
        style={{
          width: 600,
          height: 600,
          top: "-10%",
          left: "25%",
          background: "rgba(109,40,217,0.09)",
        }}
      />
      <div
        className="blob"
        style={{
          width: 350,
          height: 350,
          bottom: "5%",
          right: "-5%",
          background: "rgba(244,114,182,0.07)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="blob"
        style={{
          width: 280,
          height: 280,
          top: "45%",
          left: "-5%",
          background: "rgba(139,92,246,0.05)",
          animationDelay: "-10s",
        }}
      />

      <header
        style={{
          position: "relative",
          zIndex: 10,
          padding: "18px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg,var(--v),var(--v2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather size={15} color="white" />
          </div>
          <span
            style={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.02em" }}
          >
            SecretDiary
          </span>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onLogin}
          style={{ fontSize: 13 }}
        >
          Sign in
        </button>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "40px 24px",
          position: "relative",
          zIndex: 10,
        }}
      >
        <div className="pill pill-v" style={{ marginBottom: 26 }}>
          <Zap size={10} />
          Anonymous · Private · Real
        </div>

        <h1
          className="serif"
          style={{
            fontSize: "clamp(40px,7.5vw,84px)",
            lineHeight: 1.06,
            fontStyle: "italic",
            marginBottom: 18,
            maxWidth: 680,
          }}
        >
          Where secrets live
          <br />
          <span style={{ color: "var(--v)" }}>between the lines</span>
        </h1>

        <p
          style={{
            fontSize: 16,
            color: "var(--t2)",
            maxWidth: 440,
            lineHeight: 1.75,
            marginBottom: 34,
          }}
        >
          A quiet space to write what you can't say out loud. Share anonymously,
          read fearlessly.
        </p>

        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 56,
          }}
        >
          <button
            className="btn btn-v"
            onClick={onLogin}
            style={{ padding: "13px 26px", fontSize: 15 }}
          >
            Start writing <ArrowRight size={15} />
          </button>
          <button
            className="btn btn-ghost"
            style={{ padding: "13px 22px", fontSize: 15 }}
          >
            <Globe size={14} /> Browse entries
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            justifyContent: "center",
            marginBottom: 56,
          }}
        >
          {[
            { i: <Feather size={11} />, t: "Ghost mode" },
            { i: <Lock size={11} />, t: "Private vault" },
            { i: <Heart size={11} />, t: "React & reply" },
            { i: <TrendingUp size={11} />, t: "Trending secrets" },
          ].map((f, i) => (
            <div
              key={i}
              className="glass pill"
              style={{ padding: "5px 12px", gap: 6, borderRadius: 100 }}
            >
              <span style={{ color: "var(--v)" }}>{f.i}</span>
              <span style={{ fontSize: 12, color: "var(--t2)" }}>{f.t}</span>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            gap: 12,
            maxWidth: 700,
            width: "100%",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            {
              txt: "Sometimes the bravest thing I do all day is get out of bed.",
              n: 247,
            },
            {
              txt: "I told everyone I quit for a startup. I actually just… quit.",
              n: 831,
            },
            {
              txt: "I've been learning guitar in secret for 6 months. Still terrible.",
              n: 156,
              dim: true,
            },
          ].map((p, i) => (
            <div
              key={i}
              className="card"
              style={{
                flex: "1 1 190px",
                minWidth: 175,
                padding: "16px 18px",
                cursor: "default",
                opacity: p.dim ? 0.45 : 1,
              }}
            >
              <p
                className="serif"
                style={{
                  fontSize: 14,
                  fontStyle: "italic",
                  lineHeight: 1.65,
                  color: "var(--t1)",
                  marginBottom: 12,
                }}
              >
                "{p.txt}"
              </p>
              <div
                className="stat liked"
                style={{ fontSize: 12, cursor: "default" }}
              >
                <Heart size={12} />
                {p.n}
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer
        style={{
          position: "relative",
          zIndex: 10,
          padding: 20,
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 10, color: "var(--t3)", letterSpacing: "0.1em" }}>
          © 2026 SECRETDIARY
        </p>
      </footer>
    </div>
  );
}

/* ─── SECRET CARD ─── */
function SecretCard({
  secret,
  isLiked,
  isOwner,
  isDashboard,
  onSelect,
  onLike,
  onDelete,
  onTogglePrivacy,
}: {
  secret: Secret;
  isLiked: boolean;
  isOwner: boolean;
  isDashboard: boolean;
  onSelect: () => void;
  onLike: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePrivacy: (e: React.MouseEvent) => void;
}) {
  const ago = (ts: any) =>
    ts?.seconds
      ? formatDistanceToNow(new Date(ts.seconds * 1000), { addSuffix: true })
      : "just now";
  return (
    <div className="card" onClick={onSelect} style={{ padding: "18px 20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div
            className="avatar"
            style={{ width: 32, height: 32, fontSize: 12 }}
          >
            {(secret.authorName?.[0] || "?").toUpperCase()}
          </div>
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--t1)",
                lineHeight: 1.2,
              }}
            >
              {secret.authorName}
            </p>
            <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 1 }}>
              {ago(secret.createdAt)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {secret.isPrivate && (
            <span className="pill pill-pk">
              <Lock size={8} />
              Private
            </span>
          )}
          {!secret.isPrivate && secret.likesCount > 100 && (
            <span className="pill pill-gd">
              <Star size={8} />
              Hot
            </span>
          )}
        </div>
      </div>

      <div className="ql" style={{ marginBottom: 14 }}>
        <p
          className="serif"
          style={{
            fontSize: 17,
            fontStyle: "italic",
            lineHeight: 1.65,
            color: "var(--t1)",
          }}
        >
          {secret.content}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: 14 }}>
          <button className={cn("stat", isLiked && "liked")} onClick={onLike}>
            <Heart size={14} />
            <span>{secret.likesCount}</span>
          </button>
          <span className="stat">
            <MessageCircle size={14} />
            <span>{secret.commentsCount}</span>
          </span>
          <span className="stat">
            <Eye size={14} />
            <span>{secret.viewsCount || 0}</span>
          </span>
        </div>
        {isDashboard && isOwner && (
          <div
            style={{ display: "flex", gap: 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="btn-ico"
              title={secret.isPrivate ? "Make public" : "Make private"}
              onClick={onTogglePrivacy}
            >
              {secret.isPrivate ? <Globe size={13} /> : <Lock size={13} />}
            </button>
            <button
              className="btn-ico"
              onClick={onDelete}
              style={{ color: "rgba(248,113,113,0.45)" }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── APP ─── */
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [view, setView] = useState<View>("feed");
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [composeOpen, setComposeOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selected, setSelected] = useState<Secret | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      if (u) {
        setUser(u);
        const ref = doc(db, "users", u.uid);
        try {
          const snap = await getDoc(ref);
          if (!snap.exists()) {
            const nm = generateRandomName();
            const hh = u.email ? await hashEmail(u.email) : null;
            await setDoc(ref, {
              uid: u.uid,
              displayName: nm,
              hashedEmail: hh,
              isOnline: true,
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp(),
            });
            setUserData({ displayName: nm, isOnline: true });
          } else {
            await updateDoc(ref, {
              isOnline: true,
              lastSeen: serverTimestamp(),
            });
            setUserData({ ...snap.data(), isOnline: true });
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        setUser(null);
        setUserData(null);
        setLiked(new Set());
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const q =
      view === "feed"
        ? query(
            collection(db, "secrets"),
            where("isPrivate", "==", false),
            orderBy("createdAt", "desc"),
          )
        : query(
            collection(db, "secrets"),
            where("authorId", "==", user.uid),
            orderBy("createdAt", "desc"),
          );
    return onSnapshot(
      q,
      (snap) => {
        setSecrets(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Secret[],
        );
      },
      (e) => handleFirestoreError(e, OperationType.LIST, "secrets"),
    );
  }, [view, user]);

  useEffect(() => {
    if (!selected) {
      setComments([]);
      return;
    }
    const q = query(
      collection(db, `secrets/${selected.id}/comments`),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        setComments(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Comment[],
        );
      },
      (e) =>
        handleFirestoreError(
          e,
          OperationType.LIST,
          `secrets/${selected.id}/comments`,
        ),
    );
  }, [selected]);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      setProfileOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const createSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || !userData || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "secrets"), {
        content,
        authorId: user.uid,
        authorName: userData.displayName,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        isPrivate,
      });
      setContent("");
      setIsPrivate(false);
      setComposeOpen(false);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "secrets");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSecret = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    try {
      await deleteDoc(doc(db, "secrets", id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `secrets/${id}`);
    }
  };

  const togglePrivacy = async (s: Secret) => {
    try {
      await updateDoc(doc(db, "secrets", s.id), { isPrivate: !s.isPrivate });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `secrets/${s.id}`);
    }
  };

  const handleLike = async (id: string) => {
    if (!user) return;
    const lr = doc(db, `secrets/${id}/likes`, user.uid);
    const sr = doc(db, "secrets", id);
    try {
      const snap = await getDoc(lr);
      if (snap.exists()) {
        await deleteDoc(lr);
        await updateDoc(sr, { likesCount: increment(-1) });
        setLiked((p) => {
          const n = new Set(p);
          n.delete(id);
          return n;
        });
      } else {
        await setDoc(lr, {
          authorId: user.uid,
          secretId: id,
          createdAt: serverTimestamp(),
        });
        await updateDoc(sr, { likesCount: increment(1) });
        setLiked((p) => {
          const n = new Set(p);
          n.add(id);
          return n;
        });
      }
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.WRITE,
        `secrets/${id}/likes/${user.uid}`,
      );
    }
  };

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !user || !selected || submitting) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, `secrets/${selected.id}/comments`), {
        content: commentInput,
        authorId: user.uid,
        secretId: selected.id,
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "secrets", selected.id), {
        commentsCount: increment(1),
      });
      setCommentInput("");
    } catch (e) {
      handleFirestoreError(
        e,
        OperationType.CREATE,
        `secrets/${selected.id}/comments`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectSecret = async (s: Secret) => {
    setSelected(s);
    try {
      await updateDoc(doc(db, "secrets", s.id), { viewsCount: increment(1) });
    } catch {}
  };

  const updateName = async () => {
    if (!user || !editedName.trim() || editedName === userData?.displayName) {
      setEditingName(false);
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: editedName.trim(),
      });
      setUserData((p: any) => ({ ...p, displayName: editedName.trim() }));
      setEditingName(false);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = [...secrets]
    .filter(
      (s) => !search || s.content.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "popular") return b.likesCount - a.likesCount;
      if (sortBy === "trending")
        return (b.viewsCount || 0) - (a.viewsCount || 0);
      return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
    });

  const mine = secrets.filter((s) => s.authorId === user?.uid);
  const ago = (ts: any) =>
    ts?.seconds
      ? formatDistanceToNow(new Date(ts.seconds * 1000), { addSuffix: true })
      : "just now";

  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <style>{CSS}</style>
        <div
          style={{
            width: 36,
            height: 36,
            border: "2px solid var(--v)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--t3)", fontSize: 13 }}>Opening your diary…</p>
      </div>
    );

  if (!user) return <LandingPage onLogin={login} />;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <style>{CSS}</style>

      {/* ── HEADER ── */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          background: "rgba(8,8,15,0.92)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderBottom: "1px solid var(--b1)",
          padding: "9px 14px",
        }}
      >
        <div
          style={{
            maxWidth: 660,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              background: "linear-gradient(135deg,var(--v),var(--v2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Feather size={14} color="white" />
          </div>
          <div className="search-bar">
            <Search size={13} style={{ color: "var(--t3)", flexShrink: 0 }} />
            <input
              placeholder="Search secrets…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-v"
            onClick={() => setComposeOpen(true)}
            style={{ padding: "7px 14px", fontSize: 13, flexShrink: 0 }}
          >
            <Plus size={14} />
            Write
          </button>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              position: "relative",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              flexShrink: 0,
            }}
          >
            <div
              className="avatar"
              style={{ width: 32, height: 32, fontSize: 12 }}
            >
              {(userData?.displayName?.[0] || "?").toUpperCase()}
            </div>
            <span
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 7,
                height: 7,
                background: "#22c55e",
                borderRadius: "50%",
                border: "2px solid var(--bg)",
              }}
            />
          </button>
        </div>
      </header>

      {/* profile dropdown */}
      {profileOpen && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 49 }}
            onClick={() => setProfileOpen(false)}
          />
          <div className="dropdown fade-in">
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid var(--b1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  className="avatar"
                  style={{ width: 40, height: 40, fontSize: 14, flexShrink: 0 }}
                >
                  {(userData?.displayName?.[0] || "?").toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingName ? (
                    <div
                      style={{ display: "flex", gap: 5, alignItems: "center" }}
                    >
                      <input
                        className="input"
                        style={{ padding: "4px 9px", fontSize: 13 }}
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && updateName()}
                        autoFocus
                      />
                      <button
                        className="btn-ico"
                        style={{ width: 28, height: 28 }}
                        onClick={updateName}
                      >
                        <Check size={11} />
                      </button>
                      <button
                        className="btn-ico"
                        style={{ width: 28, height: 28 }}
                        onClick={() => setEditingName(false)}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setEditingName(true);
                        setEditedName(userData?.displayName || "");
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: "var(--t1)",
                        }}
                      >
                        {userData?.displayName}
                      </p>
                      <Edit3 size={10} style={{ color: "var(--t3)" }} />
                    </div>
                  )}
                  <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                    {user.email || "Anonymous"}
                  </p>
                </div>
              </div>
            </div>
            <div style={{ padding: 6 }}>
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  color: "rgba(248,113,113,0.75)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(248,113,113,0.08)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN ── */}
      <main
        style={{
          paddingTop: 62,
          paddingBottom: 88,
          maxWidth: 660,
          margin: "0 auto",
          padding: "62px 14px 96px",
        }}
      >
        {/* vault stats */}
        {view === "vault" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 8,
              marginBottom: 16,
              marginTop: 10,
            }}
          >
            {[
              {
                label: "Entries",
                val: mine.length,
                icon: <Feather size={13} />,
              },
              {
                label: "Likes",
                val: mine.reduce((a, s) => a + s.likesCount, 0),
                icon: <Heart size={13} />,
              },
              {
                label: "Views",
                val: mine.reduce((a, s) => a + (s.viewsCount || 0), 0),
                icon: <Eye size={13} />,
              },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div style={{ color: "var(--v)", marginBottom: 8 }}>
                  {s.icon}
                </div>
                <p
                  style={{
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: "-0.03em",
                    color: "var(--t1)",
                  }}
                >
                  {s.val}
                </p>
                <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 3 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* sort tabs */}
        {view === "feed" && (
          <div
            style={{ display: "flex", gap: 3, marginBottom: 14, marginTop: 10 }}
          >
            {(["latest", "popular", "trending"] as SortBy[]).map((s) => (
              <button
                key={s}
                className={cn("tab", sortBy === s && "on")}
                onClick={() => setSortBy(s)}
              >
                {s === "latest" && <Clock size={11} />}
                {s === "popular" && <Star size={11} />}
                {s === "trending" && <TrendingUp size={11} />}
                {s}
              </button>
            ))}
          </div>
        )}

        {/* feed */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--s2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Feather size={18} style={{ color: "var(--t3)" }} />
              </div>
              <p style={{ color: "var(--t2)", fontSize: 15, marginBottom: 5 }}>
                {search ? "No secrets match" : "Nothing here yet"}
              </p>
              <p style={{ color: "var(--t3)", fontSize: 13 }}>
                {view === "feed"
                  ? "Be the first to write something."
                  : "Your vault is empty."}
              </p>
            </div>
          ) : (
            filtered.map((s) => (
              <SecretCard
                key={s.id}
                secret={s}
                isLiked={liked.has(s.id)}
                isOwner={s.authorId === user?.uid}
                isDashboard={view === "vault"}
                onSelect={() => selectSecret(s)}
                onLike={(e) => {
                  e.stopPropagation();
                  handleLike(s.id);
                }}
                onDelete={(e) => {
                  e.stopPropagation();
                  deleteSecret(s.id);
                }}
                onTogglePrivacy={(e) => {
                  e.stopPropagation();
                  togglePrivacy(s);
                }}
              />
            ))
          )}
        </div>
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="bottom-nav">
        <div
          style={{
            maxWidth: 660,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            padding: "7px 24px",
          }}
        >
          <button
            onClick={() => setView("feed")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "7px 0",
            }}
          >
            <Globe
              size={19}
              style={{ color: view === "feed" ? "var(--v)" : "var(--t3)" }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: view === "feed" ? "var(--v)" : "var(--t3)",
                fontFamily: "inherit",
              }}
            >
              Feed
            </span>
          </button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <button
              className="btn btn-v"
              onClick={() => setComposeOpen(true)}
              style={{ width: 50, height: 50, borderRadius: 15, padding: 0 }}
            >
              <Plus size={21} />
            </button>
          </div>
          <button
            onClick={() => setView("vault")}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "7px 0",
            }}
          >
            <Bookmark
              size={19}
              style={{ color: view === "vault" ? "var(--v)" : "var(--t3)" }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: view === "vault" ? "var(--v)" : "var(--t3)",
                fontFamily: "inherit",
              }}
            >
              Vault
            </span>
          </button>
        </div>
      </nav>

      {/* ── COMPOSE MODAL ── */}
      {composeOpen && (
        <div className="modal-bg" onClick={() => setComposeOpen(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="drag" />
            <div
              style={{
                padding: "10px 18px 14px",
                borderBottom: "1px solid var(--b1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>New entry</p>
                <p style={{ fontSize: 11, color: "var(--t3)", marginTop: 2 }}>
                  Writing as {userData?.displayName}
                </p>
              </div>
              <button className="btn-ico" onClick={() => setComposeOpen(false)}>
                <X size={14} />
              </button>
            </div>
            <form onSubmit={createSecret}>
              <div style={{ padding: "16px 18px 6px" }}>
                <textarea
                  className="compose"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's been on your mind…"
                  rows={6}
                  maxLength={5000}
                  autoFocus
                />
              </div>
              <div
                style={{
                  padding: "12px 18px 18px",
                  borderTop: "1px solid var(--b1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={`pill ${isPrivate ? "pill-pk" : "pill-v"}`}
                    style={{
                      cursor: "pointer",
                      background: "none",
                      fontFamily: "inherit",
                      border: "1px solid",
                    }}
                  >
                    {isPrivate ? <Lock size={9} /> : <Globe size={9} />}
                    {isPrivate ? "Private" : "Public"}
                  </button>
                  <span style={{ fontSize: 11, color: "var(--t3)" }}>
                    {content.length}/5000
                  </span>
                </div>
                <button
                  type="submit"
                  className="btn btn-v"
                  disabled={!content.trim() || submitting}
                  style={{ fontSize: 13, padding: "8px 18px" }}
                >
                  {submitting ? "Saving…" : "Save entry"}
                  <Send size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div className="modal-bg" onClick={() => setSelected(null)}>
          <div
            className="modal-sheet"
            style={{
              maxHeight: "88vh",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="drag" />
            <div
              style={{
                padding: "8px 14px 12px",
                borderBottom: "1px solid var(--b1)",
                display: "flex",
                alignItems: "center",
                gap: 10,
                flexShrink: 0,
              }}
            >
              <button
                className="btn-ico"
                onClick={() => setSelected(null)}
                style={{ flexShrink: 0 }}
              >
                <ChevronLeft size={14} />
              </button>
              <div
                className="avatar"
                style={{ width: 30, height: 30, fontSize: 11 }}
              >
                {(selected.authorName?.[0] || "?").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500 }}>
                  {selected.authorName}
                </p>
                <p style={{ fontSize: 11, color: "var(--t3)" }}>
                  {ago(selected.createdAt)}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className={cn("stat", liked.has(selected.id) && "liked")}
                  onClick={() => handleLike(selected.id)}
                  style={{ fontSize: 13 }}
                >
                  <Heart size={14} />
                  {selected.likesCount}
                </button>
                <span
                  className="stat"
                  style={{ fontSize: 13, cursor: "default" }}
                >
                  <Eye size={14} />
                  {selected.viewsCount || 0}
                </span>
              </div>
            </div>

            <div
              style={{
                padding: "18px 18px 16px",
                borderBottom: "1px solid var(--b1)",
                flexShrink: 0,
              }}
            >
              <p
                className="serif"
                style={{
                  fontSize: 20,
                  fontStyle: "italic",
                  lineHeight: 1.65,
                  color: "var(--t1)",
                }}
              >
                "{selected.content}"
              </p>
            </div>

            <div
              style={{ flex: 1, overflowY: "auto", padding: "14px 16px" }}
              className="scroll-area"
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--t3)",
                  marginBottom: 10,
                }}
              >
                {comments.length} Reflection{comments.length !== 1 ? "s" : ""}
              </p>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "28px 0" }}>
                  <MessageCircle
                    size={22}
                    style={{ color: "var(--t3)", margin: "0 auto 8px" }}
                  />
                  <p style={{ color: "var(--t3)", fontSize: 13 }}>
                    Be the first to reflect.
                  </p>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 7 }}
                >
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        background: "var(--s2)",
                        border: "1px solid var(--b1)",
                        borderRadius: 11,
                        padding: "11px 13px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          color: "var(--t1)",
                          lineHeight: 1.6,
                          marginBottom: 6,
                        }}
                      >
                        {c.content}
                      </p>
                      <p style={{ fontSize: 11, color: "var(--t3)" }}>
                        {ago(c.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                padding: "10px 14px",
                borderTop: "1px solid var(--b1)",
                flexShrink: 0,
              }}
            >
              <form
                onSubmit={addComment}
                style={{ display: "flex", gap: 8, alignItems: "center" }}
              >
                <input
                  className="input"
                  style={{
                    borderRadius: 100,
                    padding: "8px 14px",
                    fontSize: 13,
                  }}
                  placeholder="Write a reflection…"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-v"
                  disabled={!commentInput.trim() || submitting}
                  style={{ padding: "8px 14px", flexShrink: 0 }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
