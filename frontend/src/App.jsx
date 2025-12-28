import { useEffect, useMemo, useState } from "react";
import {
  createComment,
  createCommunity,
  createPost,
  getProfile,
  listComments,
  listCommunities,
  listPosts,
  listUserCommunities,
  joinCommunity,
  leaveCommunity,
  login,
  mediaUrl,
  presignMedia,
  register,
  updateCommunity,
  updateProfile,
  uploadMedia,
} from "./api";
import AuthPage from "./components/AuthPage";
import Footer from "./components/Footer";
import Header from "./components/Header";
import PostCard from "./components/PostCard";
import PostComposer from "./components/PostComposer";
import ProfilePage from "./components/ProfilePage";
import Sidebar from "./components/Sidebar";

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
  const [communityEditForm, setCommunityEditForm] = useState({ name: "", description: "" });
  const [communityEditMessage, setCommunityEditMessage] = useState("");
  const [posts, setPosts] = useState([]);
  const [postForm, setPostForm] = useState(emptyPost);
  const [postMessage, setPostMessage] = useState("");
  const [commentLists, setCommentLists] = useState({});
  const [commentMessage, setCommentMessage] = useState("");
  const [mediaMap, setMediaMap] = useState({});
  const [activePostId, setActivePostId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({ display_name: "", username: "" });
  const [profileMessage, setProfileMessage] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [userCommunities, setUserCommunities] = useState({ created: [], joined: [] });
  const [profileTab, setProfileTab] = useState("joined");

  const loggedIn = Boolean(token);

  const selectedCommunity = useMemo(
    () => communities.find((community) => community.id === selectedCommunityId),
    [communities, selectedCommunityId]
  );

  const activePost = useMemo(
    () => posts.find((post) => post.post_id === activePostId),
    [posts, activePostId]
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
    setProfile(null);
    setProfileForm({ display_name: "", username: "" });
    setProfileMessage("");
    setProfileImageUrl("");
    setUserCommunities({ created: [], joined: [] });
  };

  const loadCommunities = async () => {
    const list = await listCommunities();
    setCommunities(list);
    if (list.length > 0 && !selectedCommunityId) {
      setSelectedCommunityId(list[0].id);
    }
  };

  useEffect(() => {
    if (selectedCommunity) {
      setCommunityEditForm({
        name: selectedCommunity.name || "",
        description: selectedCommunity.description || "",
      });
      setCommunityEditMessage("");
    }
  }, [selectedCommunity]);

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
      await loadUserCommunitiesList();
      setSelectedCommunityId(created.id);
    } catch (error) {
      setCommunityMessage(error.message);
    }
  };

  const handleUpdateCommunity = async (event) => {
    event.preventDefault();
    if (!selectedCommunityId) return;
    setCommunityEditMessage("");
    try {
      const updated = await updateCommunity(token, selectedCommunityId, communityEditForm);
      setCommunities((prev) =>
        prev.map((community) =>
          community.id === selectedCommunityId ? { ...community, ...updated } : community
        )
      );
      await loadUserCommunitiesList();
      setCommunityEditMessage("Community updated.");
    } catch (error) {
      setCommunityEditMessage(error.message);
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
      if (token) {
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
      } else {
        updates[key] = {
          url: mediaUrl(key),
          contentType: "",
        };
      }
    }
    setMediaMap((prev) => ({ ...prev, ...updates }));
  };

  const handleOpenPost = (postId) => {
    setActivePostId(postId);
    setView("post");
  };

  const handleBackHome = () => {
    setView("home");
    setActivePostId(null);
  };

  const loadProfileDetails = async () => {
    if (!token) return;
    const data = await getProfile(token);
    setProfile(data);
    setProfileForm({
      display_name: data.display_name || "",
      username: data.username || "",
    });
    if (data.profile_image_key) {
      try {
        const response = await presignMedia(token, data.profile_image_key);
        setProfileImageUrl(response.url);
      } catch (error) {
        setProfileImageUrl(mediaUrl(data.profile_image_key));
      }
    } else {
      setProfileImageUrl("");
    }
  };

  const loadUserCommunitiesList = async () => {
    if (!token) return;
    const data = await listUserCommunities(token);
    setUserCommunities({
      created: data.created || [],
      joined: data.joined || [],
    });
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    setProfileMessage("");
    try {
      const updated = await updateProfile(token, {
        display_name: profileForm.display_name,
        username: profileForm.username,
      });
      setProfile(updated);
      setProfileForm({
        display_name: updated.display_name || "",
        username: updated.username || "",
      });
      if (updated.username !== username) {
        setUsername(updated.username);
        localStorage.setItem("auth_username", updated.username);
      }
      setProfileMessage("Profile updated.");
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileMessage("");
    try {
      const upload = await uploadMedia(token, file);
      const updated = await updateProfile(token, {
        profile_image_key: upload.media_key,
      });
      setProfile(updated);
      setProfileImageUrl(upload.presigned_get_url);
      setProfileMessage("Profile photo updated.");
    } catch (error) {
      setProfileMessage(error.message);
    }
  };

  const handleOpenProfile = () => {
    setView("profile");
    setActivePostId(null);
  };

  const handleOpenCommunity = (communityId) => {
    setSelectedCommunityId(communityId);
    setView("home");
  };

  const handleToggleJoin = async () => {
    if (!selectedCommunityId) return;
    const isJoined = userCommunities.joined.some(
      (community) => community.id === selectedCommunityId
    );
    try {
      if (isJoined) {
        await leaveCommunity(token, selectedCommunityId);
      } else {
        await joinCommunity(token, selectedCommunityId);
      }
      await loadUserCommunitiesList();
    } catch (error) {
      setCommunityMessage(error.message);
    }
  };

  useEffect(() => {
    loadCommunities().catch(() => undefined);
  }, []);

  useEffect(() => {
    loadPosts(selectedCommunityId).catch(() => undefined);
  }, [selectedCommunityId]);

  useEffect(() => {
    const mediaKeys = posts.flatMap((post) => post.media_keys || []);
    if (mediaKeys.length > 0) {
      hydrateMedia(mediaKeys).catch(() => undefined);
    }
  }, [posts, token]);

  useEffect(() => {
    if (loggedIn && (view === "login" || view === "register")) {
      setView("home");
    }
  }, [loggedIn, view]);

  useEffect(() => {
    if (loggedIn) {
      loadProfileDetails().catch(() => undefined);
      loadUserCommunitiesList().catch(() => undefined);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (view === "profile" && loggedIn) {
      loadProfileDetails().catch(() => undefined);
      loadUserCommunitiesList().catch(() => undefined);
    }
  }, [view, loggedIn]);

  useEffect(() => {
    if (view === "post" && activePostId) {
      handleLoadComments(activePostId).catch(() => undefined);
    }
  }, [activePostId, view]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header
        loggedIn={loggedIn}
        username={username}
        onLogin={() => switchAuthView("login")}
        onRegister={() => switchAuthView("register")}
        onLogout={handleLogout}
        onHome={handleBackHome}
        onProfile={handleOpenProfile}
      />

      <main className="flex-1">
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
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
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
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      {selectedCommunity ? `r/${selectedCommunity.name}` : "Select a community"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {selectedCommunity?.description || "Pick a community to see posts."}
                    </p>
                    {loggedIn &&
                    profile?.id &&
                    selectedCommunity?.created_by_user_id === profile.id ? (
                      <form className="mt-4 space-y-3" onSubmit={handleUpdateCommunity}>
                        <input
                          type="text"
                          value={communityEditForm.name}
                          onChange={(event) =>
                            setCommunityEditForm({
                              ...communityEditForm,
                              name: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          required
                        />
                        <textarea
                          value={communityEditForm.description}
                          onChange={(event) =>
                            setCommunityEditForm({
                              ...communityEditForm,
                              description: event.target.value,
                            })
                          }
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
                          rows={3}
                        />
                        <button
                          className="rounded-xl bg-orange-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-500"
                          type="submit"
                        >
                          Update community
                        </button>
                        {communityEditMessage ? (
                          <span className="text-sm text-rose-500">
                            {communityEditMessage}
                          </span>
                        ) : null}
                      </form>
                    ) : null}
                  </div>
                  {loggedIn && selectedCommunity ? (
                    <button
                      type="button"
                      onClick={handleToggleJoin}
                      className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                    >
                      {userCommunities.joined.some(
                        (community) => community.id === selectedCommunity.id
                      )
                        ? "Leave community"
                        : "Join community"}
                    </button>
                  ) : null}
                </div>
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
                    onOpen={() => handleOpenPost(post.post_id)}
                  />
                ))}
              </div>
            </section>
          </div>
        ) : null}
        {view === "post" ? (
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
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
              <button
                type="button"
                className="text-sm font-semibold text-orange-600 hover:text-orange-500"
                onClick={handleBackHome}
              >
                ← Back to community feed
              </button>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase text-slate-400">Community details</p>
                    <h2 className="mt-1 text-xl font-semibold text-slate-900">
                      {selectedCommunity ? `r/${selectedCommunity.name}` : "Community"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {selectedCommunity?.description || "Select a community to see details."}
                    </p>
                  </div>
                  {loggedIn && selectedCommunity ? (
                    <button
                      type="button"
                      onClick={handleToggleJoin}
                      className="rounded-full border border-orange-200 px-4 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50"
                    >
                      {userCommunities.joined.some(
                        (community) => community.id === selectedCommunity.id
                      )
                        ? "Leave community"
                        : "Join community"}
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span>{posts.length} posts</span>
                  {selectedCommunity?.created_at ? (
                    <span>
                      Created {new Date(selectedCommunity.created_at).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>
              </div>
              {activePost ? (
                <PostCard
                  post={activePost}
                  communityName={selectedCommunity?.name}
                  mediaMap={mediaMap}
                  onLoadComments={() => handleLoadComments(activePost.post_id)}
                  comments={commentLists[activePost.post_id]}
                  onCreateComment={(payload) =>
                    handleCreateComment(activePost.post_id, payload)
                  }
                  loggedIn={loggedIn}
                  commentMessage={commentMessage}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
                  We couldn't find that post. Head back to the feed to pick one.
                </div>
              )}
            </section>
          </div>
        ) : null}
        {view === "profile" && loggedIn ? (
          <ProfilePage
            profile={profile}
            profileForm={profileForm}
            onFormChange={setProfileForm}
            onSaveProfile={handleProfileSave}
            onImageUpload={handleProfileImageUpload}
            profileMessage={profileMessage}
            profileImageUrl={profileImageUrl}
            activeTab={profileTab}
            onTabChange={setProfileTab}
            createdCommunities={userCommunities.created}
            joinedCommunities={userCommunities.joined}
            onOpenCommunity={handleOpenCommunity}
          />
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
