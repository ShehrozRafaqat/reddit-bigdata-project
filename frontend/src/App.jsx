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
  const [commentForms, setCommentForms] = useState({});
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
          [upload.media_key]: upload.presigned_get_url,
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

  const handleCreateComment = async (event, postId) => {
    event.preventDefault();
    setCommentMessage("");
    try {
      await createComment(token, {
        post_id: postId,
        body: commentForms[postId] || "",
      });
      setCommentForms((prev) => ({ ...prev, [postId]: "" }));
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
        updates[key] = response.url;
      } catch (error) {
        updates[key] = "";
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

  return (
    <div className="app">
      <header className="top-nav">
        <div className="logo">r/bigdata-demo</div>
        <div className="nav-actions">
          {loggedIn ? (
            <div className="user-info">
              <span>Signed in as {username}</span>
              <button className="btn ghost" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <form className="auth-card" onSubmit={handleAuthSubmit}>
              <div className="auth-tabs">
                <button
                  type="button"
                  className={authMode === "login" ? "active" : ""}
                  onClick={() => {
                    setAuthMode("login");
                    resetAuthForm();
                  }}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={authMode === "register" ? "active" : ""}
                  onClick={() => {
                    setAuthMode("register");
                    resetAuthForm();
                  }}
                >
                  Register
                </button>
              </div>
              <div className="auth-fields">
                <input
                  type="text"
                  placeholder="Username"
                  value={authForm.username}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, username: event.target.value }))
                  }
                  required
                />
                {authMode === "register" ? (
                  <input
                    type="email"
                    placeholder="Email"
                    value={authForm.email}
                    onChange={(event) =>
                      setAuthForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                    required
                  />
                ) : null}
                <input
                  type="password"
                  placeholder="Password"
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required
                />
              </div>
              <div className="auth-actions">
                <button className="btn primary" type="submit">
                  {authMode === "register" ? "Create account" : "Login"}
                </button>
                {authMessage ? <span className="error">{authMessage}</span> : null}
              </div>
            </form>
          )}
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>Communities</h3>
            <ul className="community-list">
              {communities.map((community) => (
                <li key={community.id}>
                  <button
                    className={
                      community.id === selectedCommunityId
                        ? "community-item active"
                        : "community-item"
                    }
                    onClick={() => setSelectedCommunityId(community.id)}
                  >
                    <span className="community-name">r/{community.name}</span>
                    <span className="community-desc">{community.description}</span>
                  </button>
                </li>
              ))}
            </ul>
            {communities.length === 0 ? (
              <p className="empty">No communities yet. Create one to start!</p>
            ) : null}
          </div>

          <div className="sidebar-section">
            <h3>Create Community</h3>
            {loggedIn ? (
              <form className="stack" onSubmit={handleCreateCommunity}>
                <input
                  type="text"
                  placeholder="Community name"
                  value={communityForm.name}
                  onChange={(event) =>
                    setCommunityForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <textarea
                  placeholder="Short description"
                  value={communityForm.description}
                  onChange={(event) =>
                    setCommunityForm((prev) => ({ ...prev, description: event.target.value }))
                />
                <button className="btn primary" type="submit">
                  Create
                </button>
                {communityMessage ? <span className="error">{communityMessage}</span> : null}
              </form>
            ) : (
              <p className="empty">Login to create a community.</p>
            )}
          </div>
        </aside>

        <section className="feed">
          <div className="feed-header">
            <div>
              <h2>{selectedCommunity ? `r/${selectedCommunity.name}` : "Select a community"}</h2>
              <p className="subtle">
                {selectedCommunity?.description || "Pick a community to see posts."}
              </p>
            </div>
          </div>

          <div className="composer">
            <h3>Create Post</h3>
            {loggedIn ? (
              <form className="stack" onSubmit={handleCreatePost}>
                <input
                  type="text"
                  placeholder="Title"
                  value={postForm.title}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                />
                <textarea
                  placeholder="Write something..."
                  value={postForm.body}
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, body: event.target.value }))
                />
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(event) =>
                    setPostForm((prev) => ({ ...prev, mediaFile: event.target.files?.[0] || null }))
                  }
                />
                <button className="btn primary" type="submit">
                  Post
                </button>
                {postMessage ? <span className="error">{postMessage}</span> : null}
              </form>
            ) : (
              <p className="empty">Login to create a post.</p>
            )}
          </div>

          <div className="feed-list">
            {posts.length === 0 ? (
              <p className="empty">No posts yet. Be the first to post!</p>
            ) : null}
            {posts.map((post) => (
              <article key={post.post_id} className="post-card">
                <div className="post-meta">
                  <span className="tag">r/{selectedCommunity?.name}</span>
                  <span className="tag">{new Date(post.created_at).toLocaleString()}</span>
                </div>
                <h3>{post.title}</h3>
                {post.body ? <p>{post.body}</p> : null}
                {post.media_keys?.length ? (
                  <div className="media">
                    {post.media_keys.map((key) => {
                      const url = mediaMap[key];
                      if (!url) return null;
                      if (url.match(/\.(mp4|webm|mov)(\?|$)/i)) {
                        return (
                          <video key={key} controls src={url} />
                        );
                      }
                      return <img key={key} src={url} alt="Post media" />;
                    })}
                  </div>
                ) : null}
                <div className="post-actions">
                  <span>{post.num_comments} comments</span>
                  <button className="btn ghost" onClick={() => handleLoadComments(post.post_id)}>
                    View comments
                  </button>
                </div>

                <div className="comments">
                  {(commentLists[post.post_id] || []).map((comment) => (
                    <div className="comment" key={comment.comment_id}>
                      <div className="comment-meta">
                        <span>u/{comment.author_user_id}</span>
                        <span>{new Date(comment.created_at).toLocaleString()}</span>
                      </div>
                      <p>{comment.body}</p>
                    </div>
                  ))}

                  {loggedIn ? (
                    <form
                      className="comment-form"
                      onSubmit={(event) => handleCreateComment(event, post.post_id)}
                    >
                      <input
                        type="text"
                        placeholder="Add a comment"
                        value={commentForms[post.post_id] || ""}
                        onChange={(event) =>
                          setCommentForms((prev) => ({
                            ...prev,
                            [post.post_id]: event.target.value,
                          }))
                        }
                        required
                      />
                      <button className="btn" type="submit">
                        Comment
                      </button>
                    </form>
                  ) : (
                    <p className="empty">Login to add comments.</p>
                  )}
                  {commentMessage ? <span className="error">{commentMessage}</span> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
