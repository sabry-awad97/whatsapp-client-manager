import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomeComponent,
});

function HomeComponent() {
  const healthCheck = useQuery(trpc.healthCheck.queryOptions());

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Template App</h1>

        <div className="mt-8 p-6 border rounded-lg">
          <p className="text-sm text-muted-foreground mb-2">Server Status</p>
          {healthCheck.isLoading && (
            <p className="text-yellow-600">Checking...</p>
          )}
          {healthCheck.isError && (
            <p className="text-red-600">Server Offline</p>
          )}
          {healthCheck.isSuccess && (
            <p className="text-green-600 font-semibold">
              {healthCheck.data || "Server Online"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
