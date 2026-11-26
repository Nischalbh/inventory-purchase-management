
import { Bell, LogOut, Menu, UserCircle } from "lucide-react";
import type { UserProfile } from "../../types/api";

interface Props {
  title: string;
  user: UserProfile;
  onSignOut: () => void;
  onMenuClick: () => void;
  unreadCount: number;
  onNotificationsClick: () => void;
}

function Navbar({
  title,
  user,
  onSignOut,
  onMenuClick,
  unreadCount,
  onNotificationsClick,
}: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold text-slate-800 sm:text-xl">
            {title}
          </h2>
          <p className="hidden text-sm text-slate-500 sm:block">
            Welcome back, {user.username}.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-5">
        <button
          type="button"
          onClick={onNotificationsClick}
          className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Bell size={21} />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <UserCircle size={32} className="text-slate-500" />
          <div className="hidden md:block">
            <p className="max-w-32 truncate text-sm font-semibold text-slate-800">
              {user.username}
            </p>
            <p className="text-xs text-slate-500">{user.role}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600"
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
