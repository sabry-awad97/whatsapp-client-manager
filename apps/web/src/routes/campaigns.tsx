import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { DataFetchError, ErrorBoundary } from "@/components/error-boundary";
import { TooltipIconButton } from "@/components/tooltip-icon-button";
import { useClients } from "@/hooks/use-clients";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import {
  Send,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  Upload,
  Download,
  Plus,
  RefreshCw,
  MoreVertical,
  Trash2,
  Copy,
  Eye,
  FileText,
  AlertCircle,
  Calendar,
  Target,
  TrendingUp,
  Loader2,
  Edit,
  StopCircle,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns")({
  component: () => (
    <ErrorBoundary>
      <CampaignsPage />
    </ErrorBoundary>
  ),
});

// ============================================================================
// TYPES - Bulk Messaging System
// ============================================================================

type CampaignStatus =
  | "draft"
  | "scheduled"
  | "running"
  | "paused"
  | "completed"
  | "failed";
type RecipientStatus = "pending" | "sent" | "delivered" | "read" | "failed";

interface BulkCampaign {
  id: string;
  name: string;
  description?: string;
  template: MessageTemplate;
  clientId: string;
  recipients: Recipient[];
  status: CampaignStatus;
  progress: CampaignProgress;
  createdAt: Date;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // in minutes
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[]; // e.g., ["name", "company", "date"]
  category?: string;
}

interface Recipient {
  id: string;
  phoneNumber: string;
  name?: string;
  variables: Record<string, string>; // Variable values for this recipient
  status: RecipientStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

interface CampaignProgress {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  pending: number;
}

interface CampaignFormData {
  name: string;
  description: string;
  clientId: string;
  templateId: string;
  templateContent: string;
  scheduledAt?: Date;
}

interface TemplateFormData {
  name: string;
  content: string;
  category: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function CampaignsPage() {
  // State
  const [campaigns, setCampaigns] = useState<BulkCampaign[]>([
    {
      id: "1",
      name: "Welcome Campaign",
      description: "Send welcome messages to new customers",
      clientId: "1",
      template: {
        id: "t1",
        name: "Welcome Message",
        content: "Hi {name}, welcome to {company}!",
        variables: ["name", "company"],
        category: "Onboarding",
      },
      recipients: [],
      status: "running",
      progress: {
        total: 1000,
        sent: 750,
        delivered: 720,
        read: 680,
        failed: 30,
        pending: 250,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      startedAt: new Date(Date.now() - 1000 * 60 * 60),
      estimatedDuration: 45,
    },
    {
      id: "2",
      name: "Product Launch",
      description: "Announce new product to existing customers",
      clientId: "2",
      template: {
        id: "t2",
        name: "Product Announcement",
        content: "Hi {name}, check out our new {product}!",
        variables: ["name", "product"],
        category: "Marketing",
      },
      recipients: [],
      status: "scheduled",
      progress: {
        total: 500,
        sent: 0,
        delivered: 0,
        read: 0,
        failed: 0,
        pending: 500,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      estimatedDuration: 25,
    },
    {
      id: "3",
      name: "Follow-up Campaign",
      description: "Follow up with customers after purchase",
      clientId: "1",
      template: {
        id: "t3",
        name: "Purchase Follow-up",
        content: "Hi {name}, how are you enjoying {product}?",
        variables: ["name", "product"],
        category: "Support",
      },
      recipients: [],
      status: "completed",
      progress: {
        total: 250,
        sent: 250,
        delivered: 245,
        read: 230,
        failed: 5,
        pending: 0,
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
      startedAt: new Date(Date.now() - 1000 * 60 * 60 * 47),
      completedAt: new Date(Date.now() - 1000 * 60 * 60 * 46),
      estimatedDuration: 15,
    },
  ]);

  const [templates] = useState<MessageTemplate[]>([
    {
      id: "t1",
      name: "Welcome Message",
      content: "Hi {name}, welcome to {company}! We're excited to have you.",
      variables: ["name", "company"],
      category: "Onboarding",
    },
    {
      id: "t2",
      name: "Product Announcement",
      content: "Hi {name}, check out our new {product}! Available now.",
      variables: ["name", "product"],
      category: "Marketing",
    },
    {
      id: "t3",
      name: "Purchase Follow-up",
      content: "Hi {name}, how are you enjoying {product}? Let us know!",
      variables: ["name", "product"],
      category: "Support",
    },
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<BulkCampaign | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Data fetching
  const { data: clients } = useClients();

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description?.toLowerCase().includes(query),
      );
    }

    return filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }, [campaigns, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = campaigns.length;
    const active = campaigns.filter((c) => c.status === "running").length;
    const scheduled = campaigns.filter((c) => c.status === "scheduled").length;
    const completed = campaigns.filter((c) => c.status === "completed").length;
    const totalRecipients = campaigns.reduce(
      (sum, c) => sum + c.progress.total,
      0,
    );
    const totalSent = campaigns.reduce((sum, c) => sum + c.progress.sent, 0);
    const totalDelivered = campaigns.reduce(
      (sum, c) => sum + c.progress.delivered,
      0,
    );
    const deliveryRate =
      totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

    return {
      total,
      active,
      scheduled,
      completed,
      totalRecipients,
      totalSent,
      totalDelivered,
      deliveryRate,
    };
  }, [campaigns]);

  // Handlers
  const handleCreateCampaign = useCallback(
    async (data: CampaignFormData) => {
      try {
        const template = templates.find((t) => t.id === data.templateId);
        if (!template) throw new Error("Template not found");

        const newCampaign: BulkCampaign = {
          id: `campaign-${Date.now()}`,
          name: data.name,
          description: data.description,
          clientId: data.clientId,
          template,
          recipients: [],
          status: data.scheduledAt ? "scheduled" : "draft",
          progress: {
            total: 0,
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            pending: 0,
          },
          createdAt: new Date(),
          scheduledAt: data.scheduledAt,
        };

        setCampaigns((prev) => [newCampaign, ...prev]);
        toast.success("Campaign created", {
          description: `${data.name} has been created successfully.`,
        });
        setIsCreateDialogOpen(false);
      } catch (error) {
        toast.error("Failed to create campaign", {
          description: "Please try again later.",
        });
      }
    },
    [templates],
  );

  const handleStartCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? { ...c, status: "running" as CampaignStatus, startedAt: new Date() }
          : c,
      ),
    );
    toast.success("Campaign started", {
      description: "Messages are being sent.",
    });
  }, []);

  const handlePauseCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId ? { ...c, status: "paused" as CampaignStatus } : c,
      ),
    );
    toast.success("Campaign paused");
  }, []);

  const handleStopCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaignId
          ? {
              ...c,
              status: "completed" as CampaignStatus,
              completedAt: new Date(),
            }
          : c,
      ),
    );
    toast.success("Campaign stopped");
  }, []);

  const handleDeleteCampaign = useCallback((campaignId: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    toast.success("Campaign deleted");
  }, []);

  const handleViewDetails = useCallback((campaign: BulkCampaign) => {
    setSelectedCampaign(campaign);
    setIsDetailsDialogOpen(true);
  }, []);

  const handleExportCampaign = useCallback(async (campaign: BulkCampaign) => {
    try {
      const data = JSON.stringify(campaign, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-${campaign.id}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Campaign exported");
    } catch (error) {
      toast.error("Export failed");
    }
  }, []);

  return (
    <div className="flex flex-col gap-0">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-background to-muted/20">
        <div className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Bulk Campaigns
            </h1>
            <p className="text-sm text-muted-foreground">
              Send templated messages to multiple recipients efficiently
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsTemplateDialogOpen(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Templates
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="border-b bg-muted/30 p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <StatCard
            label="Total"
            value={stats.total}
            icon={Target}
            color="text-blue-600"
          />
          <StatCard
            label="Active"
            value={stats.active}
            icon={Play}
            color="text-green-600"
          />
          <StatCard
            label="Scheduled"
            value={stats.scheduled}
            icon={Calendar}
            color="text-orange-600"
          />
          <StatCard
            label="Completed"
            value={stats.completed}
            icon={CheckCircle2}
            color="text-purple-600"
          />
          <StatCard
            label="Recipients"
            value={stats.totalRecipients.toLocaleString()}
            icon={Users}
            color="text-blue-600"
          />
          <StatCard
            label="Sent"
            value={stats.totalSent.toLocaleString()}
            icon={Send}
            color="text-purple-600"
          />
          <StatCard
            label="Delivered"
            value={stats.totalDelivered.toLocaleString()}
            icon={CheckCircle2}
            color="text-green-600"
          />
          <StatCard
            label="Rate"
            value={`${stats.deliveryRate}%`}
            icon={TrendingUp}
            color="text-green-600"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="border-b bg-card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {statusFilter === "all"
                  ? "All Status"
                  : statusFilter.charAt(0).toUpperCase() +
                    statusFilter.slice(1)}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("scheduled")}>
                Scheduled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("running")}>
                Running
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                Completed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Campaign List */}
      <div className="p-4">
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Get started by creating your first campaign"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                clientName={
                  clients?.find((c) => c.id === campaign.clientId)?.name ||
                  "Unknown Client"
                }
                onStart={() => handleStartCampaign(campaign.id)}
                onPause={() => handlePauseCampaign(campaign.id)}
                onStop={() => handleStopCampaign(campaign.id)}
                onDelete={() => handleDeleteCampaign(campaign.id)}
                onViewDetails={() => handleViewDetails(campaign)}
                onExport={() => handleExportCampaign(campaign)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateCampaignDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateCampaign}
        templates={templates}
        clients={clients || []}
      />

      <TemplateLibraryDialog
        open={isTemplateDialogOpen}
        onOpenChange={setIsTemplateDialogOpen}
        templates={templates}
      />

      <CampaignDetailsDialog
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        campaign={selectedCampaign}
        clientName={
          clients?.find((c) => c.id === selectedCampaign?.clientId)?.name ||
          "Unknown Client"
        }
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: typeof Target;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
      <div className={cn("p-2 rounded-md bg-muted")}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  );
}

interface CampaignCardProps {
  campaign: BulkCampaign;
  clientName: string;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onDelete: () => void;
  onViewDetails: () => void;
  onExport: () => void;
}

function CampaignCard({
  campaign,
  clientName,
  onStart,
  onPause,
  onStop,
  onDelete,
  onViewDetails,
  onExport,
}: CampaignCardProps) {
  const progress =
    campaign.progress.total > 0
      ? (campaign.progress.sent / campaign.progress.total) * 100
      : 0;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              <Badge
                variant={campaign.status === "running" ? "default" : "outline"}
              >
                {campaign.status}
              </Badge>
            </div>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mb-2">
                {campaign.description}
              </p>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{campaign.template.name}</span>
              <span>•</span>
              <span>{clientName}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onViewDetails}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              {campaign.status === "draft" && (
                <DropdownMenuItem onClick={onStart}>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </DropdownMenuItem>
              )}
              {campaign.status === "running" && (
                <>
                  <DropdownMenuItem onClick={onPause}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onStop}>
                    <StopCircle className="h-4 w-4 mr-2" />
                    Stop
                  </DropdownMenuItem>
                </>
              )}
              {campaign.status === "paused" && (
                <DropdownMenuItem onClick={onStart}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
        <div className="grid grid-cols-5 gap-2 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Sent</p>
            <p className="text-lg font-bold">{campaign.progress.sent}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Delivered</p>
            <p className="text-lg font-bold text-green-600">
              {campaign.progress.delivered}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Read</p>
            <p className="text-lg font-bold text-teal-600">
              {campaign.progress.read}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Failed</p>
            <p className="text-lg font-bold text-red-600">
              {campaign.progress.failed}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-lg font-bold text-blue-600">
              {campaign.progress.pending}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Placeholder dialog components
function CreateCampaignDialog({
  open,
  onOpenChange,
  onSubmit,
  templates,
  clients,
}: any) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    templateId: "",
    templateContent: "",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Set up a new bulk messaging campaign
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label>Campaign Name</Label>
            <Input
              placeholder="e.g., Welcome Campaign"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              placeholder="Campaign description..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Client</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={formData.clientId}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
            >
              <option value="">Select client...</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Template</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={formData.templateId}
              onChange={(e) =>
                setFormData({ ...formData, templateId: e.target.value })
              }
            >
              <option value="">Select template...</option>
              {templates.map((t: any) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSubmit(formData)}>Create Campaign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TemplateLibraryDialog({ open, onOpenChange, templates }: any) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Template Library</DialogTitle>
          <DialogDescription>
            Browse and manage message templates
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {templates.map((template: MessageTemplate) => (
              <Card key={template.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{template.name}</h4>
                      <Badge variant="outline" className="mt-1">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {template.content}
                  </p>
                  <div className="flex gap-1 mt-2">
                    {template.variables.map((v) => (
                      <Badge key={v} variant="secondary" className="text-xs">
                        {`{${v}}`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function CampaignDetailsDialog({
  open,
  onOpenChange,
  campaign,
  clientName,
}: any) {
  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{campaign.name}</DialogTitle>
          <DialogDescription>{campaign.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge>{campaign.status}</Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Client</p>
              <p className="font-medium">{clientName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Template</p>
              <p className="font-medium">{campaign.template.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Created</p>
              <p className="font-medium">
                {campaign.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Progress</h4>
            <div className="grid grid-cols-5 gap-3 text-center">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{campaign.progress.sent}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
              <div className="p-3 rounded-lg bg-green-600/10">
                <p className="text-2xl font-bold text-green-600">
                  {campaign.progress.delivered}
                </p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
              <div className="p-3 rounded-lg bg-teal-600/10">
                <p className="text-2xl font-bold text-teal-600">
                  {campaign.progress.read}
                </p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
              <div className="p-3 rounded-lg bg-red-600/10">
                <p className="text-2xl font-bold text-red-600">
                  {campaign.progress.failed}
                </p>
                <p className="text-xs text-muted-foreground">Failed</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-600/10">
                <p className="text-2xl font-bold text-blue-600">
                  {campaign.progress.pending}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
