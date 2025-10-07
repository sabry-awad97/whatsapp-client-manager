/**
 * TanStack DB Collection for Client Management
 *
 * Provides reactive client data management with automatic sync,
 * optimistic updates, and real-time queries.
 *
 * @example Basic Usage - Fetch all clients
 * ```tsx
 * function ClientsList() {
 *   const { data: clients, isLoading } = useClients();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <ul>
 *       {clients?.map(client => (
 *         <li key={client.id}>{client.name}</li>
 *       ))}
 *     </ul>
 *   );
 * }
 * ```
 *
 * @example Filtered Clients - Search and filter
 * ```tsx
 * function FilteredClients() {
 *   const [search, setSearch] = useState('');
 *   const { data: clients } = useClients({
 *     search,
 *     status: 'connected'
 *   });
 *
 *   return (
 *     <>
 *       <input value={search} onChange={e => setSearch(e.target.value)} />
 *       <div>{clients?.length} connected clients found</div>
 *     </>
 *   );
 * }
 * ```
 *
 * @example Create Client - Optimistic updates
 * ```tsx
 * function CreateClientForm() {
 *   const createClient = useCreateClient();
 *
 *   const handleSubmit = (e) => {
 *     e.preventDefault();
 *     createClient.mutate({
 *       name: 'John Doe',
 *       phoneNumber: '+1234567890',
 *       status: 'disconnected'
 *     });
 *     toast.success('Client created!');
 *   };
 *
 *   return <form onSubmit={handleSubmit}>...</form>;
 * }
 * ```
 *
 * @example Update Client Status - Toggle connection
 * ```tsx
 * function ClientStatusToggle({ clientId, currentStatus }) {
 *   const updateStatus = useUpdateClientStatus();
 *
 *   const toggle = () => {
 *     const newStatus = currentStatus === 'connected'
 *       ? 'disconnected'
 *       : 'connected';
 *     updateStatus.mutate(clientId, newStatus);
 *   };
 *
 *   return <button onClick={toggle}>Toggle Status</button>;
 * }
 * ```
 *
 * @example Real-time Subscriptions - Toast notifications
 * ```tsx
 * function ClientNotifications() {
 *   useClientChanges((changes) => {
 *     changes.forEach(change => {
 *       if (change.type === 'insert') {
 *         toast.success(`New client: ${change.value.name}`);
 *       } else if (change.type === 'update') {
 *         toast.info(`Updated: ${change.value.name}`);
 *       } else if (change.type === 'delete') {
 *         toast.error('Client deleted');
 *       }
 *     });
 *   });
 *
 *   return null; // This component just handles notifications
 * }
 * ```
 *
 * @example Watch Specific Client - Real-time updates
 * ```tsx
 * function ClientDetails({ clientId }) {
 *   const { data: client } = useClient(clientId);
 *
 *   useClientSubscription(
 *     clientId,
 *     (updatedClient) => {
 *       console.log('Client updated:', updatedClient);
 *       toast.info(`${updatedClient.name} was updated`);
 *     },
 *     () => {
 *       toast.error('Client was deleted');
 *       // Navigate away or show error
 *     }
 *   );
 *
 *   return <div>{client?.name}</div>;
 * }
 * ```
 *
 * @example Complete CRUD - All operations
 * ```tsx
 * function ClientManager() {
 *   const {
 *     clients,
 *     isLoading,
 *     createClient,
 *     updateClient,
 *     deleteClient
 *   } = useClientManagement();
 *
 *   const handleCreate = () => {
 *     createClient({
 *       name: 'New Client',
 *       phoneNumber: '+1234567890'
 *     });
 *   };
 *
 *   const handleUpdate = (id: string) => {
 *     updateClient({
 *       id,
 *       name: 'Updated Name'
 *     });
 *   };
 *
 *   const handleDelete = (id: string) => {
 *     if (confirm('Delete?')) {
 *       deleteClient(id);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleCreate}>Create</button>
 *       {clients.map(client => (
 *         <div key={client.id}>
 *           {client.name}
 *           <button onClick={() => handleUpdate(client.id)}>Edit</button>
 *           <button onClick={() => handleDelete(client.id)}>Delete</button>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Dashboard Stats - Live counts
 * ```tsx
 * function DashboardStats() {
 *   const { data: total } = useClientsCount();
 *   const { data: connected } = useConnectedClientsCount();
 *
 *   return (
 *     <div>
 *       <div>Total Clients: {total}</div>
 *       <div>Connected: {connected}</div>
 *       <div>Disconnected: {total - connected}</div>
 *     </div>
 *   );
 * }
 * ```
 */

import { queryCollectionOptions } from "@tanstack/query-db-collection";
import {
  createCollection,
  eq,
  useLiveQuery,
  or,
  ilike,
  type ChangeListener,
} from "@tanstack/react-db";
import { getClients, type MockClient } from "@/domain/mocks";
import { queryClient } from "@/utils/trpc";
import { useEffect } from "react";

// ============================================================================
// TYPES
// ============================================================================

export type ClientStatus = MockClient["status"];

export interface ClientFilters {
  status?: ClientStatus;
  search?: string;
}

export interface CreateClientInput {
  name: string;
  phoneNumber: string;
  status?: ClientStatus;
}

export interface UpdateClientInput {
  id: string;
  name?: string;
  phoneNumber?: string;
  status?: ClientStatus;
}

// ============================================================================
// API SIMULATION FUNCTIONS
// ============================================================================

/**
 * Simulates fetching clients from API
 */
async function fetchClients(): Promise<MockClient[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getClients();
}

/**
 * Simulates creating a new client
 */
async function createClientAPI(input: CreateClientInput): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  // In real implementation, this would call the API
}

/**
 * Simulates updating a client
 */
async function updateClientAPI(input: UpdateClientInput): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  // In real implementation, this would call the API
}

/**
 * Simulates deleting a client
 */
async function deleteClientAPI(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  // In real implementation, this would call the API
}

// ============================================================================
// COLLECTION DEFINITION
// ============================================================================

// ============================================================================
// QUERY KEYS
// ============================================================================

export const clientKeys = {
  all: ["clients"] as const,
};

/**
 * Clients collection with TanStack DB
 */
export const clientsCollection = createCollection(
  queryCollectionOptions({
    queryKey: clientKeys.all,
    queryClient,
    queryFn: fetchClients,
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];
      await createClientAPI({
        name: modified.name,
        phoneNumber: modified.phoneNumber,
        status: modified.status,
      });
    },
    onUpdate: async ({ transaction }) => {
      const { modified } = transaction.mutations[0];
      await updateClientAPI({
        id: modified.id,
        name: modified.name,
        phoneNumber: modified.phoneNumber,
        status: modified.status,
      });
    },
    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0];
      await deleteClientAPI(original.id);
    },
  }),
);

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

/**
 * Hook to fetch all clients with reactive updates
 *
 * @example
 * ```tsx
 * function ClientsList() {
 *   const { data: clients, isLoading, status } = useClients();
 *
 *   if (isLoading) return <Spinner />;
 *   return clients?.map(c => <ClientCard key={c.id} client={c} />);
 * }
 * ```
 *
 * @example With filters
 * ```tsx
 * const [search, setSearch] = useState('');
 * const { data: clients } = useClients({
 *   search,
 *   status: 'connected'
 * });
 * ```
 */
export const useClients = (filters?: ClientFilters) => {
  const query = useLiveQuery((q) => {
    let builder = q.from({ client: clientsCollection });

    // Apply status filter
    if (filters?.status) {
      builder = builder.where(({ client }) =>
        eq(client.status, filters.status),
      );
    }

    // Apply search filter using ilike (case-insensitive pattern matching)
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      builder = builder.where(({ client }) =>
        or(
          ilike(client.name, searchPattern),
          ilike(client.phoneNumber, searchPattern),
        ),
      );
    }

    return builder;
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    status: query.status,
  };
};

/**
 * Hook to fetch a single client by ID
 *
 * @example
 * ```tsx
 * function ClientProfile({ clientId }: { clientId: string }) {
 *   const { data: client, isLoading } = useClient(clientId);
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (!client) return <div>Client not found</div>;
 *
 *   return <div>{client.name} - {client.phoneNumber}</div>;
 * }
 * ```
 */
export const useClient = (id: string | undefined) => {
  const query = useLiveQuery((q) =>
    q
      .from({ client: clientsCollection })
      .where(({ client }) => eq(client.id, id))
      .limit(1),
  );

  return {
    data: query.data?.[0],
    isLoading: query.isLoading,
    isError: query.isError,
    status: query.status,
  };
};

/**
 * Hook to get clients by status
 *
 * @example
 * ```tsx
 * function ConnectedClients() {
 *   const { data: clients } = useClientsByStatus('connected');
 *   return <div>{clients?.length} clients online</div>;
 * }
 * ```
 */
export const useClientsByStatus = (status: ClientStatus) => {
  const query = useLiveQuery((q) =>
    q
      .from({ client: clientsCollection })
      .where(({ client }) => eq(client.status, status)),
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    status: query.status,
  };
};

/**
 * Hook to create a new client
 *
 * @example
 * ```tsx
 * function AddClientButton() {
 *   const createClient = useCreateClient();
 *
 *   const handleAdd = () => {
 *     createClient.mutate({
 *       name: 'John Doe',
 *       phoneNumber: '+1234567890',
 *       status: 'disconnected'
 *     });
 *     toast.success('Client added!');
 *   };
 *
 *   return <button onClick={handleAdd}>Add Client</button>;
 * }
 * ```
 */
export const useCreateClient = () => {
  const createNewClient = (input: CreateClientInput): MockClient => ({
    id: Math.random().toString(36).substring(2, 11),
    name: input.name,
    phoneNumber: input.phoneNumber,
    status: input.status || "disconnected",
    lastConnected: null,
    messagesSent: 0,
    messagesDelivered: 0,
    messagesFailed: 0,
    createdAt: new Date(),
  });

  return {
    mutate: (input: CreateClientInput) => {
      return clientsCollection.insert(createNewClient(input));
    },
  };
};

/**
 * Hook to update a client
 *
 * @example
 * ```tsx
 * function EditClientForm({ client }: { client: MockClient }) {
 *   const updateClient = useUpdateClient();
 *   const [name, setName] = useState(client.name);
 *
 *   const handleSave = () => {
 *     updateClient.mutate({ id: client.id, name });
 *     toast.success('Client updated!');
 *   };
 *
 *   return (
 *     <>
 *       <input value={name} onChange={e => setName(e.target.value)} />
 *       <button onClick={handleSave}>Save</button>
 *     </>
 *   );
 * }
 * ```
 */
export const useUpdateClient = () => {
  const updateClientData = (input: UpdateClientInput) =>
    clientsCollection.update(input.id, (draft) => {
      if (input.name !== undefined) draft.name = input.name;
      if (input.phoneNumber !== undefined)
        draft.phoneNumber = input.phoneNumber;
      if (input.status !== undefined) {
        draft.status = input.status;
        if (input.status === "connected") {
          draft.lastConnected = new Date();
        }
      }
    });

  return {
    mutate: updateClientData,
  };
};

/**
 * Hook to update client status specifically
 *
 * @example
 * ```tsx
 * function StatusToggle({ clientId, status }: { clientId: string, status: ClientStatus }) {
 *   const updateStatus = useUpdateClientStatus();
 *
 *   const toggle = () => {
 *     const newStatus = status === 'connected' ? 'disconnected' : 'connected';
 *     updateStatus.mutate(clientId, newStatus);
 *   };
 *
 *   return (
 *     <button onClick={toggle}>
 *       {status === 'connected' ? 'Disconnect' : 'Connect'}
 *     </button>
 *   );
 * }
 * ```
 */
export const useUpdateClientStatus = () => {
  const updateClient = useUpdateClient();

  return {
    mutate: (clientId: string, status: ClientStatus) => {
      updateClient.mutate({ id: clientId, status });
    },
  };
};

/**
 * Hook to delete a client
 *
 * @example
 * ```tsx
 * function DeleteClientButton({ clientId, clientName }: { clientId: string, clientName: string }) {
 *   const deleteClient = useDeleteClient();
 *
 *   const handleDelete = () => {
 *     if (confirm(`Delete ${clientName}?`)) {
 *       deleteClient.mutate(clientId);
 *       toast.success('Client deleted');
 *     }
 *   };
 *
 *   return <button onClick={handleDelete}>Delete</button>;
 * }
 * ```
 */
export const useDeleteClient = () => ({
  mutate: (id: string) => clientsCollection.delete(id),
});

/**
 * Hook to get client count
 *
 * @example
 * ```tsx
 * function TotalClientsWidget() {
 *   const { data: count } = useClientsCount();
 *   return <div className="stat">Total: {count}</div>;
 * }
 * ```
 */
export const useClientsCount = () => {
  const { data } = useClients();
  return { data: data?.length || 0 };
};

/**
 * Hook to get connected clients count
 *
 * @example
 * ```tsx
 * function OnlineStatus() {
 *   const { data: online } = useConnectedClientsCount();
 *   return <Badge>{online} online</Badge>;
 * }
 * ```
 */
export const useConnectedClientsCount = () => {
  const { data } = useClientsByStatus("connected");
  return { data: data?.length || 0 };
};

/**
 * Hook to subscribe to client collection changes
 * @param listener - Callback function that receives change events
 * @example
 * ```tsx
 * useClientChanges((changes) => {
 *   changes.forEach(change => {
 *     console.log(`${change.type}: ${change.key}`, change.value);
 *
 *     if (change.type === 'insert') {
 *       toast.success(`New client: ${change.value.name}`);
 *     } else if (change.type === 'update') {
 *       toast.info(`Updated: ${change.value.name}`);
 *     } else if (change.type === 'delete') {
 *       toast.info(`Deleted client`);
 *     }
 *   });
 * });
 * ```
 */
export const useClientChanges = (
  listener: ChangeListener<MockClient, string | number>,
) => {
  useEffect(() => {
    const subscription = clientsCollection.subscribeChanges(listener);
    return () => subscription.unsubscribe();
  }, [listener]);
};

/**
 * Hook to subscribe to specific client changes by ID
 * @param clientId - ID of the client to watch
 * @param onUpdate - Callback when the client is updated
 * @param onDelete - Callback when the client is deleted
 * @example
 * ```tsx
 * useClientSubscription('client-123',
 *   (client) => console.log('Updated:', client),
 *   () => console.log('Deleted')
 * );
 * ```
 */
export const useClientSubscription = (
  clientId: string,
  onUpdate?: (client: MockClient) => void,
  onDelete?: () => void,
) => {
  useEffect(() => {
    const subscription = clientsCollection.subscribeChanges((changes) => {
      changes.forEach((change) => {
        if (change.key === clientId) {
          if (change.type === "update" && onUpdate) {
            onUpdate(change.value);
          } else if (change.type === "delete" && onDelete) {
            onDelete();
          }
        }
      });
    });

    return () => subscription.unsubscribe();
  }, [clientId, onUpdate, onDelete]);
};

/**
 * Compound hook that provides all client operations
 */
export const useClientManagement = (filters?: ClientFilters) => {
  const clientsQuery = useClients(filters);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();
  const deleteMutation = useDeleteClient();
  const updateStatusMutation = useUpdateClientStatus();

  return {
    // Query state
    clients: clientsQuery.data || [],
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    status: clientsQuery.status,
    // Mutations
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    updateClientStatus: updateStatusMutation.mutate,
    deleteClient: deleteMutation.mutate,
  };
};
