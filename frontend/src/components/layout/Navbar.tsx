
import { Search, Bell, UserCircle } from "lucide-react";

function Navbar() {
return (
    <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-8">
    <div>
        <h2 className="text-xl font-semibold text-slate-800">
        Dashboard
        </h2>
        <p className="text-sm text-slate-500">
        Welcome back! Here's your inventory overview.
        </p>
    </div>

    <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
        <Search size={18} className="text-slate-500" />
        <input
            type="text"
            placeholder="Search..."
            className="w-36 bg-transparent text-sm outline-none"
        />
        </div>

        <button className="relative text-slate-600">
        <Bell size={21} />
        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-2">
        <UserCircle size={32} className="text-slate-500" />
        <div>
            <p className="text-sm font-semibold text-slate-800">Admin</p>
            <p className="text-xs text-slate-500">Administrator</p>
        </div>
        </div>
    </div>
    </header>
);
}

export default Navbar;
