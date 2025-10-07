import { Link, useLocation } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

const pathNames: Record<string, string> = {
  "": "Dashboard",
  clients: "Clients",
};

export function BreadcrumbNav() {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const name = pathNames[segment] || segment;

        return (
          <Fragment key={segment}>
            <ChevronRight className="h-4 w-4" />
            {isLast ? (
              <span className="font-medium text-foreground">{name}</span>
            ) : (
              <Link
                to={href}
                className="hover:text-foreground transition-colors"
              >
                {name}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
