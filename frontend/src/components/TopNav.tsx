import { NavLink } from "react-router-dom";

export function TopNav({ isAdmin }) {
  const cls = (isActive) => "navItem" + (isActive ? " navItemActive" : "");

  return (
    <header className="topBar">
      <nav className="topNav">
        <NavLink to="/" className={({ isActive }) => cls(isActive)}>Home</NavLink>
        <NavLink to="/gm" className={({ isActive }) => cls(isActive)}>GM</NavLink>
        <NavLink to="/gn" className={({ isActive }) => cls(isActive)}>GN</NavLink>
        <NavLink to="/referrals" className={({ isActive }) => cls(isActive)}>Referrals</NavLink>
        <NavLink to="/leaderboard" className={({ isActive }) => cls(isActive)}>Leaderboard</NavLink>
        <NavLink to="/themes" className={({ isActive }) => cls(isActive)}>Themes</NavLink>
        <NavLink to="/extension-themes" className={({ isActive }) => cls(isActive)}>Extension Themes</NavLink>
        <NavLink to="/upgrade-pro" className={({ isActive }) => cls(isActive)}>Upgrade Pro</NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => cls(isActive)}>Admin</NavLink>
        )}
      </nav>
    </header>
  );
}
