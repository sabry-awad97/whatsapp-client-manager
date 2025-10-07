import { AppSidebar } from "@/components/app-sidebar";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import Loader from "@/components/loader";
import { StatusBar } from "@/components/status-bar";
import { ThemeProvider } from "@/components/theme-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { trpc } from "@/utils/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
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
        title: "WhatsApp Client Manager - Dashboard",
      },
      {
        name: "description",
        content:
          "Manage multiple WhatsApp clients, send bulk messages, and monitor campaigns",
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

  const { isLoading, isError } = useQuery(
    trpc.healthCheck.queryOptions(undefined, {
      refetchInterval: 30000,
      retry: false,
    }),
  );

  const serverStatus = isLoading ? "checking" : isError ? "offline" : "online";

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        <div className="flex h-screen bg-background antialiased">
          <AppSidebar />
          <main
            className="flex-1 overflow-hidden"
            style={{ marginLeft: "var(--sidebar-width, 208px)" }}
          >
            <ScrollArea className="h-full">
              {/* Breadcrumb Navigation */}
              <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="px-4 py-3">
                  <BreadcrumbNav />
                </div>
              </div>
              {/* Main Content */}
              <div className="p-4 pb-10">
                {isFetching ? <Loader /> : <Outlet />}
              </div>
            </ScrollArea>
          </main>
        </div>
        <StatusBar serverStatus={serverStatus} />
        <Toaster richColors />
      </ThemeProvider>
      {/* <TanStackRouterDevtools position="bottom-left" /> */}
      <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
    </>
  );
}
