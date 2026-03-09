import { useBridgeCopy } from "../bridgeI18n";

type TopNavProps = {
  currentRoute?: string;
  isAdmin?: boolean;
  onNavigate?: (route: string) => void;
};

type NavItem = {
  route: "/" | "/access" | "/referrals" | "/admin";
  label: string;
};

function isActiveRoute(currentRoute: string, route: string): boolean {
  return currentRoute === route;
}

function toHref(route: string): string {
  return route === "/" ? "/bridge" : `/bridge${route}`;
}

export function TopNav({ currentRoute = "/", isAdmin = false, onNavigate }: TopNavProps) {
  const { copy } = useBridgeCopy();
  const baseItems: NavItem[] = [
    { route: "/", label: copy("navOverview", "Overview") },
    { route: "/access", label: copy("navAccess", "Access") },
    { route: "/referrals", label: copy("navReferrals", "Referrals") },
  ];
  const items = isAdmin ? [...baseItems, { route: "/admin", label: copy("navAdmin", "Admin") }] : baseItems;

  return (
    <header className="topBar">
      <nav className="topNav">
        {items.map((item) => {
          const href = toHref(item.route);
          const className = "navItem" + (isActiveRoute(currentRoute, item.route) ? " navItemActive" : "");

          return (
            <a
              key={item.route}
              href={href}
              className={className}
              onClick={(event) => {
                if (!onNavigate) return;
                if (event.defaultPrevented) return;
                if (event.button !== 0) return;
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                onNavigate(item.route);
              }}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
