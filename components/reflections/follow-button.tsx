"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { followUser, unfollowUser } from "@/app/actions/follows";

export function FollowButton({
  targetUserId,
  initialFollowing,
}: {
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    if (following) {
      await unfollowUser(targetUserId);
      setFollowing(false);
    } else {
      await followUser(targetUserId);
      setFollowing(true);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        following
          ? "bg-emerald-500/15 text-emerald-400 hover:bg-red-500/15 hover:text-red-400"
          : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
      } disabled:opacity-50`}
    >
      {following ? <UserCheck size={14} /> : <UserPlus size={14} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}
