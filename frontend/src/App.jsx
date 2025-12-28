import { useEffect, useMemo, useState } from "react";
import {
  createComment,
  createCommunity,
  createPost,
  listComments,
  listCommunities,
  listPosts,
  login,
  presignMedia,
  register,
  uploadMedia,
} from "./api";
import AuthPage from "./components/AuthPage";
import PostCard from "./components/PostCard";
import PostComposer from "./components/PostComposer";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";

const emptyForm = {
  username: "",
  email: "",
  password: "",
};

const emptyPost = {
  title: "",
  body: "",
  mediaFile: null,
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("auth_token") || "");
  const [username, setUsername] = useState(localStorage.getItem("auth_username") || "");
  const [view, setView] = useState("home");
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(emptyForm);
  const [authMessage, setAuthMessage] = useState("");
  const [communities, setCommunities] = useState([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState(null);
  const [communityForm, setCommunityForm] = useState({ name: "", description: "" });
  const [communityMessage, setCommunityMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState(emptyPost);
  const [postMessage, setPostMessage] = useState("");
  const [commentLists, setCommentLists] = useState({});
  const [commentMessage, setCommentMessage] = useState("");
  const [mediaMap, setMediaMap] = useState({});

  const loggedIn = Boolean(token);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId]
  );

  const resetAuthForm = () => {
    setAuthForm(emptyForm);
    setAuthMessage("");
  };

  const switchAuthView = (mode) => {
    setAuthMode(mode);
    resetAuthForm();
    setView(mode);
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthMessage("");
    try {
      if (authMode === "register") {
        await register({
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
        });
      }

      const loginResponse = await login({
        username: authForm.username,
        password: authForm.password,
      });
      localStorage.setItem("auth_token", loginResponse.access_token);
      localStorage.setItem("auth_username", authForm.username);
      setToken(loginResponse.access_token);
      setUsername(authForm.username);
      setView("home");
      resetAuthForm();
    } catch (error) {
      setAuthMessage(error.message);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUsername("");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_username");
    setView("home");
  };

  const loadCommunities = async () => {
    const list = await listCommunities();
    setCommunities(list);
    if (list.length > 0 && !selectedCommunityId) {
      setSelectedCommunityId(list[0].id);
    }
  };

  const loadPosts = async (communityId) => {
    if (!communityId) {
      setPosts([]);
      return;
    }
    const list = await listPosts(communityId);
    setPosts(list);
  };

  const handleCreateCommunity = async (event) => {
    event.preventDefault();
    setCommunityMessage("");
    try {
      const created = await createCommunity(token, communityForm);
      setCommunityForm({ name: "", description: "" });
      await loadCommunities();
      setSelectedCommunityId(created.id);
    } catch (error) {
      setCommunityMessage(error.message);
    }
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();
    setPostMessage("");
    if (!selectedCommunityId) {
      setPostMessage("Select a community first.");
      return;
    }
    try {
      const mediaKeys = [];
      if (postForm.mediaFile) {
        const upload = await uploadMedia(token, postForm.mediaFile);
        mediaKeys.push(upload.media_key);
        setMediaMap((prev) => ({
          ...prev,
          [upload.media_key]: {
            url: upload.presigned_get_url,
            contentType: upload.content_type,
          },
        }));
      }

      await createPost(token, {
        community_id: selectedCommunityId,
        title: postForm.title,
        body: postForm.body,
        media_keys: mediaKeys,
      });
      setPostForm(emptyPost);
      await loadPosts(selectedCommunityId);
    } catch (error) {
      setPostMessage(error.message);
    }
  };

  const handleLoadComments = async (postId) => {
    const list = await listComments(postId);
    setCommentLists((prev) => ({ ...prev, [postId]: list }));
  };

  const handleCreateComment = async (postId, { parentId, body }) => {
    setCommentMessage("");
    try {
      await createComment(token, {
        post_id: postId,
        body,
        parent_comment_id: parentId || null,
      });
      await handleLoadComments(postId);
      await loadPosts(selectedCommunityId);
    } catch (error) {
      setCommentMessage(error.message);
    }
  };

  const hydrateMedia = async (mediaKeys) => {
    const missingKeys = mediaKeys.filter((key) => !mediaMap[key]);
    if (missingKeys.length === 0) return;

    const updates = {};
    for (const key of missingKeys) {
      try {
        const response = await presignMedia(token, key);
        updates[key] = {
          url: response.url,
          contentType: response.content_type,
        };
      } catch (error) {
        updates[key] = {
          url: "",
          contentType: "",
        };
      }
    }
    setMediaMap((prev) => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    loadCommunities().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadPosts(selectedCommunityId).catch(() => undefined);
  }, [selectedCommunityId]);

  useEffect(() => {
    const mediaKeys = posts.flatMap((post) => post.media_keys || []);
    if (mediaKeys.length > 0 && token) {
      hydrateMedia(mediaKeys).catch(() => undefined);
    }
  }, [posts, token]);

  useEffect(() => {
    if (loggedIn && view !== "home") {
      setView("home");
    }
  }, [loggedIn, view]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopNav
        loggedIn={loggedIn}
        username={username}
        onLogin={() => switchAuthView("login")}
        onRegister={() => switchAuthView("register")}
        onLogout={handleLogout}
        onHome={() => setView("home")}
      />

      {view === "login" && !loggedIn ? (
        <AuthPage
          mode="login"
          authForm={authForm}
          message={authMessage}
          onChange={setAuthForm}
          onSubmit={handleAuthSubmit}
          onSwitchMode={switchAuthView}
          onBack={() => setView("home")}
        />
      ) : null}
      {view === "register" && !loggedIn ? (
        <AuthPage
          mode="register"
          authForm={authForm}
          message={authMessage}
          onChange={setAuthForm}
          onSubmit={handleAuthSubmit}
          onSwitchMode={switchAuthView}
          onBack={() => setView("home")}
        />
      ) : null}
      {view === "home" ? (
        <main className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
          <Sidebar
            communities={communities}
            selectedCommunityId={selectedCommunityId}
            onSelectCommunity={setSelectedCommunityId}
            loggedIn={loggedIn}
            communityForm={communityForm}
            onCommunityFormChange={setCommunityForm}
            onCreateCommunity={handleCreateCommunity}
            communityMessage={communityMessage}
          />

          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedCommunity ? `r/${selectedCommunity.name}` : "Select a community"}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {selectedCommunity?.description || "Pick a community to see posts."}
              </p>
            </div>

            <PostComposer
              loggedIn={loggedIn}
              postForm={postForm}
              onPostFormChange={setPostForm}
              onCreatePost={handleCreatePost}
              postMessage={postMessage}
            />

            <div className="space-y-6">
              {posts.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                  No posts yet. Be the first to post!
                </p>
              ) : null}
              {posts.map((post) => (
                <PostCard
                  key={post.post_id}
                  post={post}
                  communityName={selectedCommunity?.name}
                  mediaMap={mediaMap}
                  onLoadComments={() => handleLoadComments(post.post_id)}
                  comments={commentLists[post.post_id]}
                  onCreateComment={(payload) => handleCreateComment(post.post_id, payload)}
                  loggedIn={loggedIn}
                  commentMessage={commentMessage}
                />
              ))}
            </div>
          </section>
        </main>
      ) : null}
    </div>
  );
}
