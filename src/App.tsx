import React, { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  ensureAnonymousAuth, 
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
  signOut
} from "./firebase";
import { formatDistanceToNow } from "date-fns";
import { 
  Heart, 
  MessageCircle, 
  Send, 
  Plus, 
  X, 
  Shield, 
  LayoutDashboard, 
  Globe, 
  Lock, 
  Trash2, 
  MoreVertical,
  ChevronLeft,
  LogOut,
  Edit3,
  Check,
  Eye,
  Sparkles,
  Quote,
  Mail,
  ArrowRight,
  Zap,
  Ghost
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const RANDOM_ADJECTIVES = ["Silent", "Hidden", "Mystic", "Ethereal", "Vibrant", "Dark", "Golden", "Swift", "Calm", "Wild"];
const RANDOM_NOUNS = ["Shadow", "Echo", "Diary", "Spirit", "Ghost", "Phoenix", "Raven", "Wolf", "Storm", "Breeze"];

const generateRandomName = () => {
  const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
  const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
};

async function hashEmail(email: string) {
  const msgUint8 = new TextEncoder().encode(email.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
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

interface User {
  uid: string;
  displayName: string;
  isOnline: boolean;
  lastSeen: any;
}

type View = "feed" | "dashboard";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-pink-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-pink-900/10 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-pink-500" />
          <span className="text-2xl font-black tracking-tighter">SecretDiary</span>
        </div>
        <button 
          onClick={onLogin}
          className="px-6 py-2.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-2xl font-bold text-sm transition-all"
        >
          Sign In
        </button>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-pink-500 text-[10px] font-black uppercase tracking-[0.3em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap className="w-3 h-3" />
          The Anonymous Social Network
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] mb-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          YOUR <span className="text-pink-500">SECRET</span> DIARY.
        </h1>
        
        <p className="text-xl text-neutral-400 mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          If you liked to know secrets and if you have anything to share anonymously, this is the right place. A safe space for your untold stories.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
          <button 
            onClick={onLogin}
            className="group px-10 py-5 bg-pink-600 hover:bg-pink-500 text-white font-black rounded-[2rem] transition-all shadow-2xl shadow-pink-600/20 flex items-center gap-3 text-lg uppercase tracking-widest"
          >
            Get Started
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <div className="px-8 py-5 border border-neutral-800 rounded-[2rem] text-neutral-500 font-bold uppercase tracking-widest text-sm">
            100% Anonymous
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          {[
            { icon: Ghost, title: "Ghost Mode", desc: "No tracking, no profiles, just your entries." },
            { icon: Lock, title: "Private Vault", desc: "Keep your deepest secrets locked away for yourself." },
            { icon: Globe, title: "Global Feed", desc: "See what the world is writing about in real-time." }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-neutral-900/50 border border-neutral-800 rounded-[2.5rem] text-left hover:border-neutral-700 transition-all group">
              <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-pink-600/10 transition-colors">
                <feature.icon className="w-6 h-6 text-pink-500" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight mb-2">{feature.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-12 text-center border-t border-neutral-900">
        <p className="text-[10px] text-neutral-700 font-black uppercase tracking-[0.5em]">
          &copy; 2026 SecretDiary. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [view, setView] = useState<View>("feed");
  const [isNewSecretModalOpen, setIsNewSecretModalOpen] = useState(false);
  const [newSecretContent, setNewSecretContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedSecret, setSelectedSecret] = useState<Secret | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentContent, setNewCommentContent] = useState("");
  const [isBlurred, setIsBlurred] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [likedSecrets, setLikedSecrets] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setIsLoading(true);
      if (u) {
        setUser(u);
        setAuthError(null);
        
        // Fetch or create user profile
        const userRef = doc(db, "users", u.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const newName = generateRandomName();
            const hashedEmail = u.email ? await hashEmail(u.email) : null;
            await setDoc(userRef, {
              uid: u.uid,
              displayName: newName,
              hashedEmail: hashedEmail,
              isOnline: true,
              lastSeen: serverTimestamp(),
              createdAt: serverTimestamp()
            });
            setUserData({ displayName: newName, hashedEmail, isOnline: true });
          } else {
            const data = userSnap.data();
            await updateDoc(userRef, {
              isOnline: true,
              lastSeen: serverTimestamp()
            });
            setUserData({ ...data, isOnline: true });
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${u.uid}`);
        }
      } else {
        if (user) {
          const userRef = doc(db, "users", user.uid);
          updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {});
        }
        setUser(null);
        setUserData(null);
        setLikedSecrets(new Set());
      }
      setIsLoading(false);
    });

    const handleBlur = () => {
      setIsBlurred(true);
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userRef, { isOnline: false, lastSeen: serverTimestamp() }).catch(() => {});
      }
    };
    const handleFocus = () => {
      setIsBlurred(false);
      if (auth.currentUser) {
        const userRef = doc(db, "users", auth.currentUser.uid);
        updateDoc(userRef, { isOnline: true, lastSeen: serverTimestamp() }).catch(() => {});
      }
    };
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBlur);

    return () => {
      unsubscribe();
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBlur);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    let q;
    const path = "secrets";
    if (view === "feed") {
      q = query(
        collection(db, path), 
        where("isPrivate", "==", false),
        orderBy("createdAt", "desc")
      );
    } else {
      q = query(
        collection(db, path), 
        where("authorId", "==", user.uid),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const secretsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Secret[];
      setSecrets(secretsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [view, user]);

  useEffect(() => {
    if (!selectedSecret) {
      setComments([]);
      return;
    }

    const path = `secrets/${selectedSecret.id}/comments`;
    const q = query(
      collection(db, path),
      orderBy("createdAt", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
      setComments(commentsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [selectedSecret]);

  const handleCreateSecret = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecretContent.trim() || !user || !userData || isSubmitting) return;

    setIsSubmitting(true);
    const path = "secrets";
    try {
      await addDoc(collection(db, path), {
        content: newSecretContent,
        authorId: user.uid,
        authorName: userData.displayName,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        isPrivate: isPrivate
      });
      setNewSecretContent("");
      setIsPrivate(false);
      setIsNewSecretModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSecret = async (secretId: string) => {
    if (!confirm("Are you sure you want to delete this secret?")) return;
    const path = `secrets/${secretId}`;
    try {
      await deleteDoc(doc(db, "secrets", secretId));
      if (selectedSecret?.id === secretId) setSelectedSecret(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const togglePrivacy = async (secret: Secret) => {
    const path = `secrets/${secret.id}`;
    try {
      await updateDoc(doc(db, "secrets", secret.id), {
        isPrivate: !secret.isPrivate
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleLike = async (secretId: string) => {
    if (!user) return;
    const likePath = `secrets/${secretId}/likes/${user.uid}`;
    const secretRef = doc(db, "secrets", secretId);
    const likeRef = doc(db, `secrets/${secretId}/likes`, user.uid);

    try {
      const likeDoc = await getDoc(likeRef);
      if (likeDoc.exists()) {
        await deleteDoc(likeRef);
        await updateDoc(secretRef, { likesCount: increment(-1) });
        setLikedSecrets(prev => {
          const next = new Set(prev);
          next.delete(secretId);
          return next;
        });
      } else {
        await setDoc(likeRef, { authorId: user.uid, secretId, createdAt: serverTimestamp() });
        await updateDoc(secretRef, { likesCount: increment(1) });
        setLikedSecrets(prev => {
          const next = new Set(prev);
          next.add(secretId);
          return next;
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, likePath);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim() || !user || !selectedSecret || isSubmitting) return;

    setIsSubmitting(true);
    const path = `secrets/${selectedSecret.id}/comments`;
    try {
      await addDoc(collection(db, path), {
        content: newCommentContent,
        authorId: user.uid,
        secretId: selectedSecret.id,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, "secrets", selectedSecret.id), {
        commentsCount: increment(1)
      });
      setNewCommentContent("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const incrementViews = async (secretId: string) => {
    const secretRef = doc(db, "secrets", secretId);
    try {
      await updateDoc(secretRef, {
        viewsCount: increment(1)
      });
    } catch (error) {
      console.error("Error incrementing views:", error);
    }
  };

  const handleSelectSecret = (secret: Secret) => {
    setSelectedSecret(secret);
    incrementViews(secret.id);
  };

  const handleUpdateName = async () => {
    if (!user || !userData || !editedName.trim() || editedName === userData.displayName) {
      setIsEditingName(false);
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: editedName.trim()
      });
      setUserData({ ...userData, displayName: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
    }
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="bg-neutral-900 border-2 border-red-500/50 p-8 rounded-3xl text-neutral-100 max-w-md space-y-6">
          <Shield className="w-12 h-12 text-red-500" />
          <h2 className="text-2xl font-bold">Setup Required</h2>
          <p className="text-neutral-400">{authError}</p>
          <a href="https://console.firebase.google.com/project/gen-lang-client-0689877891/authentication/providers" target="_blank" className="block w-full py-4 bg-pink-600 text-center font-bold rounded-2xl">Open Console</a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage onLogin={handleGoogleLogin} />;
  }

  return (
    <div className={cn(
      "min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-pink-500/30",
      isBlurred && "blur-xl pointer-events-none select-none"
    )}>
      {/* Sidebar / Navigation */}
      <nav className="fixed left-0 top-0 bottom-0 w-20 md:w-64 bg-neutral-900 border-r border-neutral-800 hidden sm:flex flex-col p-4 z-40">
          <div className="flex items-center gap-3 px-4 py-8 mb-8">
            <Shield className="w-8 h-8 text-pink-500" />
            <span className="text-xl font-black tracking-tighter hidden md:block uppercase">SecretDiary</span>
          </div>
        
        <div className="space-y-2 flex-1">
          <button 
            onClick={() => setView("feed")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all",
              view === "feed" ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <Globe className="w-6 h-6" />
            <span className="font-bold hidden md:block">Global Feed</span>
          </button>
          <button 
            onClick={() => setView("dashboard")}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all",
              view === "dashboard" ? "bg-pink-600 text-white shadow-lg shadow-pink-600/20" : "hover:bg-neutral-800 text-neutral-400"
            )}
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="font-bold hidden md:block">The Vault</span>
          </button>
        </div>

        <div className="mt-auto space-y-4">
          {user && !user.isAnonymous ? (
            <div className="p-4 bg-neutral-800/50 rounded-2xl border border-neutral-700 hidden md:block">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center font-bold">
                  {userData?.displayName?.[0] || "?"}
                </div>
                <div className="overflow-hidden flex-1">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input 
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="bg-neutral-900 border-none text-xs w-full p-1 rounded"
                        autoFocus
                      />
                      <button onClick={handleUpdateName} className="text-green-500"><Check className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <p className="font-bold truncate text-sm">{userData?.displayName}</p>
                      <button 
                        onClick={() => { setIsEditingName(true); setEditedName(userData?.displayName || ""); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="w-3 h-3 text-neutral-500" />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest truncate">
                    {user.email ? `${user.email.split('@')[0]}...` : "Anonymous"}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-neutral-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-black font-bold rounded-2xl hover:bg-neutral-200 transition-all hidden md:flex"
            >
              <Mail className="w-5 h-5" />
              Sign in with Google
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/80 backdrop-blur-md border-t border-neutral-800 sm:hidden flex justify-around p-4 z-40">
        <button onClick={() => setView("feed")} className={cn("p-2 rounded-xl", view === "feed" ? "text-pink-500" : "text-neutral-500")}>
          <Globe className="w-6 h-6" />
        </button>
        <button onClick={() => setIsNewSecretModalOpen(true)} className="p-2 bg-pink-600 text-white rounded-full -mt-8 shadow-xl">
          <Plus className="w-6 h-6" />
        </button>
        <button onClick={() => setView("dashboard")} className={cn("p-2 rounded-xl", view === "dashboard" ? "text-pink-500" : "text-neutral-500")}>
          <LayoutDashboard className="w-6 h-6" />
        </button>
      </nav>

      {/* Main Content */}
      <main className="sm:pl-20 md:pl-64 w-full">
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24 sm:pb-8">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-4xl font-black tracking-tight uppercase">
                {view === "feed" ? "Global Entries" : "The Vault"}
              </h2>
              <p className="text-neutral-500 text-sm mt-1">
                {view === "feed" ? "Secrets from around the world." : "Your personal collection of secrets."}
              </p>
            </div>
          <div className="flex items-center gap-4">
            {user?.isAnonymous && (
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-800 hover:border-neutral-700 rounded-xl text-xs font-bold transition-all"
              >
                <Mail className="w-4 h-4" />
                Sync with Google
              </button>
            )}
            <button 
              onClick={() => setIsNewSecretModalOpen(true)}
              className="hidden sm:flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-pink-600/20"
            >
              <Plus className="w-5 h-5" />
              New Entry
            </button>
          </div>
        </header>

        <div className="grid gap-6">
            {secrets.length === 0 ? (
              <div className="text-center py-24 border-2 border-dashed border-neutral-800 rounded-[2.5rem] bg-neutral-900/20">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-neutral-500 font-medium">Nothing to see here yet...</p>
                <p className="text-neutral-700 text-xs uppercase tracking-widest mt-2">Silence is golden</p>
              </div>
            ) : (
              secrets.map((secret) => (
              <div 
                key={secret.id}
                className="group relative bg-neutral-900/40 backdrop-blur-sm border border-neutral-800/50 rounded-[2rem] p-8 hover:border-pink-500/30 transition-all cursor-pointer overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-pink-500/5"
                onClick={() => handleSelectSecret(secret)}
              >
                {/* Background Glow */}
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full group-hover:bg-pink-500/10 transition-colors" />
                
                {secret.isPrivate && (
                  <div className="absolute top-6 right-6 z-10">
                    <div className="flex items-center gap-1.5 bg-pink-500/10 text-pink-500 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-pink-500/20">
                      <Lock className="w-3 h-3" />
                      Private
                    </div>
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-xl flex items-center justify-center text-xs font-black text-pink-500 border border-neutral-700/50 shadow-inner">
                      {secret.authorName?.[0] || "?"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
                        {secret.authorName}
                      </span>
                      <span className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest">
                        {secret.createdAt?.seconds ? formatDistanceToNow(new Date(secret.createdAt.seconds * 1000), { addSuffix: true }) : "just now"}
                      </span>
                    </div>
                  </div>

                  <div className="relative mb-10">
                    <Quote className="absolute -left-4 -top-4 w-8 h-8 text-pink-500/10 rotate-180" />
                    <p className="text-xl lg:text-2xl leading-relaxed font-serif italic text-neutral-200 pl-4 border-l-2 border-pink-500/20 group-hover:border-pink-500/40 transition-colors">
                      {secret.content}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-neutral-800/50">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(secret.id);
                        }}
                        className={cn(
                          "flex items-center gap-2 transition-all group/like",
                          likedSecrets.has(secret.id) ? "text-pink-500" : "text-neutral-500 hover:text-pink-500"
                        )}
                      >
                        <Heart className={cn("w-4 h-4 transition-transform group-hover/like:scale-110", likedSecrets.has(secret.id) && "fill-current")} />
                        <span className="text-xs font-black tracking-tighter">{secret.likesCount}</span>
                      </button>
                      
                      <div className="flex items-center gap-2 text-neutral-500 group/comment">
                        <MessageCircle className="w-4 h-4 transition-transform group-hover/comment:scale-110" />
                        <span className="text-xs font-black tracking-tighter">{secret.commentsCount}</span>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-500 group/views">
                        <Eye className="w-4 h-4 transition-transform group-hover/views:scale-110" />
                        <span className="text-xs font-black tracking-tighter">{secret.viewsCount || 0}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {view === "dashboard" && (
                        <>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePrivacy(secret); }}
                            className="p-2 hover:bg-neutral-800/50 rounded-xl text-neutral-600 hover:text-pink-500 transition-all"
                            title={secret.isPrivate ? "Make Public" : "Make Private"}
                          >
                            {secret.isPrivate ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSecret(secret.id); }}
                            className="p-2 hover:bg-neutral-800/50 rounded-xl text-neutral-600 hover:text-pink-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <div className="p-2 text-neutral-700">
                        <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  </main>

      {/* Modals */}
      {isNewSecretModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 flex items-center justify-between border-b border-neutral-800">
              <div>
                <h2 className="text-2xl font-black tracking-tight uppercase">New Entry</h2>
                <p className="text-neutral-500 text-[10px] uppercase tracking-widest mt-1">Shared as {userData?.displayName}</p>
              </div>
              <button onClick={() => setIsNewSecretModalOpen(false)} className="p-2 hover:bg-neutral-800 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateSecret} className="p-8 space-y-6">
              <textarea
                autoFocus
                value={newSecretContent}
                onChange={(e) => setNewSecretContent(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full h-48 bg-transparent border-none focus:ring-0 text-xl lg:text-2xl resize-none placeholder:text-neutral-800 font-medium leading-tight"
                maxLength={5000}
              />
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-8 border-t border-neutral-800 gap-6">
                <div className="flex items-center gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsPrivate(!isPrivate)}
                    className={cn(
                      "flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all font-black text-xs uppercase tracking-[0.2em]",
                      isPrivate ? "bg-pink-600/10 border-pink-600 text-pink-500" : "border-neutral-800 text-neutral-500 hover:border-neutral-700"
                    )}
                  >
                    {isPrivate ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    {isPrivate ? "Private Vault" : "Public Feed"}
                  </button>
                  <span className="text-[10px] text-neutral-700 font-black uppercase tracking-widest">
                    {newSecretContent.length}/5000
                  </span>
                </div>
                
                <button
                  disabled={!newSecretContent.trim() || isSubmitting}
                  className="px-12 py-4 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm shadow-xl shadow-pink-600/20"
                >
                  {isSubmitting ? "Saving..." : "Save Entry"}
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] w-full max-w-xl h-[75vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-300">
            <div className="p-6 flex items-center justify-between border-b border-neutral-800">
              <button onClick={() => setSelectedSecret(null)} className="p-2 hover:bg-neutral-800 rounded-2xl transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-400">{selectedSecret.authorName}</span>
                </div>
                <span className="text-[9px] text-neutral-600 font-bold uppercase mt-1">
                  {selectedSecret.createdAt?.seconds ? formatDistanceToNow(new Date(selectedSecret.createdAt.seconds * 1000), { addSuffix: true }) : "just now"}
                </span>
              </div>
              <button className="p-2 hover:bg-neutral-800 rounded-2xl transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 lg:p-14 space-y-16">
              <div className="relative">
                <div className="absolute -left-6 top-0 bottom-0 w-1 bg-pink-500/20 rounded-full" />
                <p className="text-xl lg:text-2xl font-medium leading-relaxed text-neutral-100 tracking-tight font-serif italic">
                  "{selectedSecret.content}"
                </p>
              </div>

              <div className="space-y-12">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-neutral-500">Reflections</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(selectedSecret.id)}
                      className={cn("flex items-center gap-2 transition-colors", likedSecrets.has(selectedSecret.id) ? "text-pink-500" : "text-neutral-500")}
                    >
                      <Heart className={cn("w-4 h-4", likedSecrets.has(selectedSecret.id) && "fill-current")} />
                      <span className="text-xs font-bold">{selectedSecret.likesCount}</span>
                    </button>
                    <div className="flex items-center gap-2 text-neutral-500">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">{comments.length}</span>
                    </div>
                    <div className="flex items-center gap-2 text-neutral-500">
                      <Eye className="w-4 h-4" />
                      <span className="text-xs font-bold">{selectedSecret.viewsCount || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {comments.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-neutral-800/50 rounded-[2.5rem] bg-neutral-900/10">
                      <MessageCircle className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                      <p className="text-neutral-600 font-medium italic">No reflections yet. Be the first to respond.</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="group relative bg-neutral-800/20 border border-neutral-800/50 rounded-[2rem] p-8 space-y-4 hover:bg-neutral-800/30 transition-all">
                        <div className="absolute top-8 left-4 w-1 h-8 bg-pink-500/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-neutral-200 text-xl leading-relaxed font-serif">{comment.content}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-neutral-800/30">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-pink-600/20 border border-pink-500/30 rounded-full flex items-center justify-center text-[8px] font-black text-pink-500">A</div>
                            <span className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">ANONYMOUS</span>
                          </div>
                          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-widest">
                            {comment.createdAt?.seconds ? formatDistanceToNow(new Date(comment.createdAt.seconds * 1000), { addSuffix: true }) : "just now"}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-neutral-800 bg-neutral-900/80 backdrop-blur-md">
              <form onSubmit={handleAddComment} className="flex gap-4 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Write a reflection..."
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-2xl px-8 py-5 focus:ring-2 focus:ring-pink-500 transition-all text-xl placeholder:text-neutral-700"
                />
                <button
                  disabled={!newCommentContent.trim() || isSubmitting}
                  className="px-10 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-2xl transition-all font-black uppercase tracking-[0.2em] shadow-xl shadow-pink-600/20"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

