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
        <div className="flex items-center gap-2 relative">
            {showMenu ? (
                <div
                    className="flex items-center gap-2 py-1"
                // onMouseLeave={() => setShowMenu(false)}
                >
                    <div className="flex items-center justify-center bg-background rounded-full gap-3">
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Avatar"
                                className="avatar-lg"
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="no-avatar-lg">
                                <User className="w-4 aspect-square" />
                            </div>
                        )}
                        <p className="w-28 pr- py-1 text-sm font-medium text-foreground truncate">{user?.email}</p>
                    </div>
                    {/* <p className="text-sm text-muted-foreground mt-1 mb-4">Hello, {firstName}!</p> */}
                    <div className="flex items-center gap-2 px-1">
                        <button onClick={handleSignOut} className="menu-btn hover:text-destructive" title='Sign out'>
                            <LogOut className="w-4 aspect-square" />
                        </button>
                        <button onClick={() => setShowMenu(false)} className='menu-btn' title='Close menu'>
                            <X className="w-4 aspect-square" />
                        </button>
                    </div>
                </div>
            ) : (
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
                        <div className="no-avatar">
                            {initial}
                        </div>
                    )}
                </button>
            )}
        </div>
    );
}