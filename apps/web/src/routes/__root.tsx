import { AppSidebar } from "@/components/app-sidebar";
import Loader from "@/components/loader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import type { trpc } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useRouterState,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import "../index.css";

export interface RouterAppContext {
  trpc: typeof trpc;
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "Template App - Dashboard",
      },
      {
        name: "description",
        content: "Modern full-stack application with clean architecture",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const isFetching = useRouterState({
    select: (s) => s.isLoading,
  });

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="flex min-h-screen bg-background antialiased">
          <AppSidebar />
          <main
            className="flex-1 overflow-auto"
            style={{ marginLeft: "var(--sidebar-width, 208px)" }}
          >
            <div className="h-full p-4">
              {isFetching ? <Loader /> : <Outlet />}
            </div>
          </main>
        </div>
        <Toaster richColors />
      </ThemeProvider>
      {/* <TanStackRouterDevtools position="bottom-left" /> */}
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
