export default function PostMedia({ mediaKeys, mediaMap }) {
  if (!mediaKeys?.length) return null;

  return (
    <div className="mt-4 grid gap-3">
      {mediaKeys.map((key) => {
        const entry = mediaMap[key];
        const url = typeof entry === "string" ? entry : entry?.url;
        const contentType = typeof entry === "string" ? "" : entry?.contentType || "";
        if (!url) return null;
        if (contentType.startsWith("video/") || url.match(/\.(mp4|webm|mov|ogg)(\?|$)/i)) {
          return <video key={key} controls className="w-full rounded-xl" src={url} />;
        }
        if (contentType.startsWith("image/") || url.match(/\.(png|jpe?g|gif|webp)(\?|$)/i)) {
          return (
            <img
              key={key}
              src={url}
              alt="Post media"
              loading="lazy"
              className="w-full rounded-xl object-cover"
            />
          );
        }
        return null;
      })}
    </div>
  );
}
