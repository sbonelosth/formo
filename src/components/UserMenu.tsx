import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, User, X } from 'lucide-react';

export default function UserMenu() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const avatarUrl = user?.user_metadata?.avatar_url;
    const fullName = user?.user_metadata?.full_name;
    const firstName = fullName?.split(' ')[0] || 'there';
    const initial = (user?.email?.[0] ?? '?').toUpperCase();

    return (
        <div className="relative">
            <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1 hover:opacity-80 transition-opacity"
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={fullName || user?.email || 'User'}
                        className="avatar-sm"
                        referrerPolicy="no-referrer"
                    />
                ) : (
                    <div className="w-7 h-7 rounded-full border border-foreground bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {initial}
                    </div>
                )}
            </button>

            {showMenu && (
                <div
                    className="absolute -right-12 top-full mt-1 bg-background border border-foreground shadow-md z-20 flex flex-col items-center px-8 py-6 min-w-[320px]"
                    onMouseLeave={() => setShowMenu(false)}
                >
                    <button onClick={() => setShowMenu(false)} className='absolute right-4 top-4'>
                        <X className="w-6 aspect-square text-muted-foreground" />
                    </button>
                    <p className="text-sm font-medium text-foreground">{user?.email}</p>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="avatar-lg"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="no-avatar-lg">
                            <User className="w-8 h-8" />
                        </div>
                    )}
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Hello, {firstName}!</p>
                    <div className="border-t border-foreground w-full mb-4" />
                    <button
                        onClick={handleSignOut}
                        className="text-sm px-4 hover:text-destructive transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}