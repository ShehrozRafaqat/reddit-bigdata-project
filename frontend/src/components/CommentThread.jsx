import CommentItem from "./CommentItem";

const buildThread = (comments) => {
  const byParent = new Map();
  comments.forEach((comment) => {
    const parentId = comment.parent_comment_id || null;
    if (!byParent.has(parentId)) {
      byParent.set(parentId, []);
    }
    byParent.get(parentId).push(comment);
  });
  return byParent;
};

export default function CommentThread({ comments, loggedIn, onReply }) {
  const grouped = buildThread(comments);

  const renderBranch = (parentId, depth) => {
    const children = grouped.get(parentId) || [];
    return children.map((comment) => {
      const replies = renderBranch(comment.comment_id, depth + 1);
      return (
        <CommentItem
          key={comment.comment_id}
          comment={comment}
          depth={depth}
          loggedIn={loggedIn}
          onReply={(body) => onReply(comment.comment_id, body)}
        >
          {replies.length > 0 ? replies : null}
        </CommentItem>
      );
    });
  };

  return <div className="space-y-3">{renderBranch(null, 0)}</div>;
}
