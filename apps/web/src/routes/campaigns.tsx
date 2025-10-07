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
import {
  useCampaignManagement,
  useCampaignRealtime,
} from "@/hooks/use-campaigns";
import {
  CSVUploadDialog,
  ScheduleDialog,
  RateLimitDialog,
} from "@/components/campaign-dialogs";
import {
  type CSVRecipient,
  type RateLimitConfig,
  RATE_LIMIT_PRESETS,
} from "@/lib/campaign-utils";
import {
  type BulkCampaign,
  type CampaignStatus,
  type MessageTemplate,
} from "@/domain/mocks";
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
  Calendar as CalendarIcon,
  Target,
  TrendingUp,
  Loader2,
  Edit,
  StopCircle,
  Search,
  Filter,
  ChevronDown,
  Settings,
  Zap,
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/campaigns")({
  component: () => (
    <ErrorBoundary>
      <CampaignsPage />
    </ErrorBoundary>
  ),
});

// ============================================================================
// LOCAL TYPES (Not in centralized mock data)
// ============================================================================

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
  // Use campaign management hook
  const {
    campaigns,
    templates,
    isLoading,
    startCampaign,
    pauseCampaign,
    stopCampaign,
    deleteCampaign,
    createCampaign,
  } = useCampaignManagement();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isCSVUploadOpen, setIsCSVUploadOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<BulkCampaign | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [csvRecipients, setCSVRecipients] = useState<CSVRecipient[]>([]);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitConfig>(
    RATE_LIMIT_PRESETS.moderate,
  );

  // Data fetching
  const { data: clients } = useClients();

  // Real-time updates for running campaigns (optional - for live progress)
  const realtimeProgress = useCampaignRealtime(
    campaigns.find((c: BulkCampaign) => c.status === "running")?.id || null,
  );

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
        const template = templates.find(
          (t: MessageTemplate) => t.id === data.templateId,
        );
        if (!template) throw new Error("Template not found");

        // Use hook mutation to create campaign
        createCampaign(
          {
            name: data.name,
            description: data.description,
            templateId: data.templateId,
            clientId: data.clientId,
            recipients: csvRecipients,
            scheduledAt: data.scheduledAt,
          },
          {
            onSuccess: () => {
              toast.success("Campaign created", {
                description: `${data.name} has been created successfully.`,
              });
              setIsCreateDialogOpen(false);
              setCSVRecipients([]); // Clear uploaded recipients
            },
            onError: (error) => {
              toast.error("Failed to create campaign", {
                description: error.message || "Please try again later.",
              });
            },
          },
        );
      } catch (error) {
        toast.error("Failed to create campaign", {
          description: "Please try again later.",
        });
      }
    },
    [templates, createCampaign, csvRecipients],
  );

  const handleStartCampaign = useCallback(
    (campaignId: string) => {
      const campaign = campaigns.find((c: BulkCampaign) => c.id === campaignId);
      if (!campaign) return;

      // Validate before starting
      if (campaign.progress.total === 0) {
        toast.error("Cannot start campaign", {
          description: "No recipients found. Please add recipients first.",
        });
        return;
      }

      // Use hook mutation
      startCampaign(campaignId, {
        onSuccess: () => {
          const isResuming = campaign.status === "paused";
          toast.success(isResuming ? "Campaign resumed" : "Campaign started", {
            description: isResuming
              ? `Continuing with ${campaign.progress.pending} pending messages`
              : `Sending messages to ${campaign.progress.total} recipients`,
            duration: 5000,
          });
        },
      });
    },
    [campaigns, startCampaign],
  );

  const handlePauseCampaign = useCallback(
    (campaignId: string) => {
      const campaign = campaigns.find((c: BulkCampaign) => c.id === campaignId);
      if (!campaign) return;

      // Use hook mutation
      pauseCampaign(campaignId, {
        onSuccess: () => {
          toast.success("Campaign paused", {
            description: `${campaign.progress.sent} messages sent, ${campaign.progress.pending} pending`,
            duration: 5000,
          });
        },
      });
    },
    [campaigns, pauseCampaign],
  );

  const handleStopCampaign = useCallback(
    (campaignId: string) => {
      const campaign = campaigns.find((c: BulkCampaign) => c.id === campaignId);
      if (!campaign) return;

      // Confirm before stopping
      const confirmed = window.confirm(
        `Are you sure you want to stop this campaign?\n\n` +
          `Sent: ${campaign.progress.sent}\n` +
          `Pending: ${campaign.progress.pending}\n\n` +
          `This action cannot be undone.`,
      );

      if (!confirmed) return;

      // Use hook mutation
      stopCampaign(campaignId, {
        onSuccess: () => {
          toast.success("Campaign stopped", {
            description: `Final stats: ${campaign.progress.sent} sent, ${campaign.progress.delivered} delivered`,
            duration: 5000,
          });
        },
      });
    },
    [campaigns, stopCampaign],
  );

  const handleDeleteCampaign = useCallback(
    (campaignId: string) => {
      deleteCampaign(campaignId, {
        onSuccess: () => {
          toast.success("Campaign deleted");
        },
      });
    },
    [deleteCampaign],
  );

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

  // New handlers for advanced features
  const handleCSVUpload = useCallback((recipients: CSVRecipient[]) => {
    setCSVRecipients(recipients);
    toast.success(`Loaded ${recipients.length} recipients`, {
      description: "Ready to create campaign",
    });
  }, []);

  const handleSchedule = useCallback((date: Date) => {
    setScheduledDate(date);
    toast.success("Campaign scheduled", {
      description: `Will start at ${date.toLocaleString()}`,
    });
  }, []);

  const handleRateLimitSave = useCallback((config: RateLimitConfig) => {
    setRateLimit(config);
    toast.success("Rate limit configured", {
      description: `${config.messagesPerSecond} messages/second`,
    });
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
            <TooltipIconButton
              tooltip="Upload recipients (CSV)"
              variant="outline"
              size="sm"
              onClick={() => setIsCSVUploadOpen(true)}
            >
              <Upload className="h-4 w-4" />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="Schedule campaign"
              variant="outline"
              size="sm"
              onClick={() => setIsScheduleOpen(true)}
            >
              <CalendarIcon className="h-4 w-4" />
            </TooltipIconButton>
            <TooltipIconButton
              tooltip="Rate limit settings"
              variant="outline"
              size="sm"
              onClick={() => setIsRateLimitOpen(true)}
            >
              <Zap className="h-4 w-4" />
            </TooltipIconButton>
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
            icon={CalendarIcon}
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
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

      {/* Advanced Feature Dialogs */}
      <CSVUploadDialog
        open={isCSVUploadOpen}
        onOpenChange={setIsCSVUploadOpen}
        onUpload={handleCSVUpload}
        templateVariables={["name", "company", "product"]}
      />

      <ScheduleDialog
        open={isScheduleOpen}
        onOpenChange={setIsScheduleOpen}
        onSchedule={handleSchedule}
      />

      <RateLimitDialog
        open={isRateLimitOpen}
        onOpenChange={setIsRateLimitOpen}
        onSave={handleRateLimitSave}
        currentConfig={rateLimit}
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

  // Status badge styling
  const getStatusBadge = () => {
    switch (campaign.status) {
      case "running":
        return (
          <Badge className="bg-green-600 hover:bg-green-700">
            <Play className="h-3 w-3 mr-1" />
            Running
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            <Pause className="h-3 w-3 mr-1" />
            Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "scheduled":
        return (
          <Badge className="bg-orange-600 hover:bg-orange-700">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-600 hover:bg-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Edit className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        campaign.status === "running" && "ring-2 ring-green-500/20",
      )}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
              {getStatusBadge()}
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
        {/* Progress Bar with Animation */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <span>Progress</span>
              {campaign.status === "running" && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Sending...
                </span>
              )}
            </div>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress
            value={progress}
            className={cn(campaign.status === "running" && "animate-pulse")}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-5 gap-2 text-center">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Sent</p>
            <p className="text-lg font-bold">{campaign.progress.sent}</p>
          </div>
          <div className="p-2 rounded-lg bg-green-600/10">
            <p className="text-xs text-muted-foreground mb-1">Delivered</p>
            <p className="text-lg font-bold text-green-600">
              {campaign.progress.delivered}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-teal-600/10">
            <p className="text-xs text-muted-foreground mb-1">Read</p>
            <p className="text-lg font-bold text-teal-600">
              {campaign.progress.read}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-red-600/10">
            <p className="text-xs text-muted-foreground mb-1">Failed</p>
            <p className="text-lg font-bold text-red-600">
              {campaign.progress.failed}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-600/10">
            <p className="text-xs text-muted-foreground mb-1">Pending</p>
            <p className="text-lg font-bold text-blue-600">
              {campaign.progress.pending}
            </p>
          </div>
        </div>

        {/* Quick Actions for Running/Paused Campaigns */}
        {(campaign.status === "running" || campaign.status === "paused") && (
          <div className="flex items-center gap-2 pt-2 border-t">
            {campaign.status === "running" ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onPause}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={onStart}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                Resume
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              className="flex-1"
            >
              <StopCircle className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Multi-Step Campaign Creation Wizard
 * Step 1: Basic Info (Name, Description)
 * Step 2: Select Client
 * Step 3: Choose Template
 * Step 4: Upload Recipients (CSV)
 * Step 5: Configure Rate Limiting
 * Step 6: Review & Launch
 */
function CreateCampaignDialog({
  open,
  onOpenChange,
  onSubmit,
  templates,
  clients,
}: any) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    templateId: "",
    templateContent: "",
  });
  const [uploadedRecipients, setUploadedRecipients] = useState<CSVRecipient[]>(
    [],
  );
  const [selectedRateLimit, setSelectedRateLimit] =
    useState<keyof typeof RATE_LIMIT_PRESETS>("moderate");
  const [messageDelay, setMessageDelay] = useState(1); // seconds between messages

  const connectedClients = clients.filter((c: any) => c.status === "connected");
  const selectedTemplate = templates.find(
    (t: any) => t.id === formData.templateId,
  );
  const selectedClient = clients.find((c: any) => c.id === formData.clientId);
  const rateLimitConfig = RATE_LIMIT_PRESETS[selectedRateLimit];

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.clientId.length > 0;
      case 3:
        return formData.templateId.length > 0;
      case 4:
        return uploadedRecipients.length > 0;
      case 5:
        return messageDelay > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      recipients: uploadedRecipients,
      rateLimit: rateLimitConfig,
      messageDelay,
    });
    // Reset wizard
    setStep(1);
    setFormData({
      name: "",
      description: "",
      clientId: "",
      templateId: "",
      templateContent: "",
    });
    setUploadedRecipients([]);
  };

  const handleCSVUpload = (recipients: CSVRecipient[]) => {
    setUploadedRecipients(recipients);
    toast.success(`Loaded ${recipients.length} recipients`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Bulk Campaign</DialogTitle>
          <DialogDescription>
            Step {step} of 6 -{" "}
            {step === 1
              ? "Basic Information"
              : step === 2
                ? "Select WhatsApp Client"
                : step === 3
                  ? "Choose Message Template"
                  : step === 4
                    ? "Import Recipients"
                    : step === 5
                      ? "Configure Sending Speed"
                      : "Review & Launch"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Welcome Campaign"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Give your campaign a descriptive name
                  </p>
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of this campaign..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Select Client */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label>Select WhatsApp Client *</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose which WhatsApp client will send the messages
                  </p>
                  {connectedClients.length === 0 ? (
                    <Card className="border-destructive">
                      <CardContent className="p-4 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-sm font-medium">
                            No connected clients
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Please connect a client before creating a campaign
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {connectedClients.map((client: any) => (
                        <Card
                          key={client.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            formData.clientId === client.id &&
                              "ring-2 ring-primary shadow-md",
                          )}
                          onClick={() =>
                            setFormData({ ...formData, clientId: client.id })
                          }
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{client.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {client.phoneNumber}
                                </p>
                              </div>
                              <Badge variant="secondary">Connected</Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Sent
                                </p>
                                <p className="text-sm font-bold">
                                  {client.messagesSent}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Delivered
                                </p>
                                <p className="text-sm font-bold text-green-600">
                                  {client.messagesDelivered}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">
                                  Failed
                                </p>
                                <p className="text-sm font-bold text-red-600">
                                  {client.messagesFailed}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Choose Template */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label>Select Message Template *</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Choose a pre-defined template with variable placeholders
                  </p>
                  <div className="grid gap-3">
                    {templates.map((template: any) => (
                      <Card
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          formData.templateId === template.id &&
                            "ring-2 ring-primary shadow-md",
                        )}
                        onClick={() =>
                          setFormData({ ...formData, templateId: template.id })
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-semibold">{template.name}</p>
                              <Badge variant="outline" className="mt-1">
                                {template.category}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            {template.content}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {template.variables.map((v: string) => (
                              <Badge
                                key={v}
                                variant="secondary"
                                className="text-xs"
                              >
                                {`{${v}}`}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Upload Recipients */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Import Recipients from CSV *</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upload a CSV file with phone numbers and template variables
                  </p>

                  {/* CSV Upload Area */}
                  <Card className="border-dashed border-2">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-sm font-medium mb-1">
                          {uploadedRecipients.length > 0
                            ? `${uploadedRecipients.length} recipients loaded`
                            : "Upload CSV file"}
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          CSV must include: phone_number, name, and template
                          variables
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Trigger file input
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = ".csv";
                              input.onchange = async (e: any) => {
                                const file = e.target.files[0];
                                if (file) {
                                  try {
                                    const { parseCSV } = await import(
                                      "@/lib/campaign-utils"
                                    );
                                    const result = await parseCSV(file);
                                    setUploadedRecipients(result.recipients);
                                    toast.success(
                                      `Loaded ${result.validRows} recipients`,
                                      {
                                        description:
                                          result.errors.length > 0
                                            ? `${result.errors.length} rows had errors`
                                            : "All rows valid",
                                      },
                                    );
                                  } catch (error) {
                                    toast.error("Failed to parse CSV");
                                  }
                                }
                              };
                              input.click();
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadedRecipients.length > 0
                              ? "Replace"
                              : "Upload"}{" "}
                            CSV
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              const { downloadCSVTemplate } = await import(
                                "@/lib/campaign-utils"
                              );
                              downloadCSVTemplate(
                                selectedTemplate?.variables || [],
                              );
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Preview Recipients */}
                  {uploadedRecipients.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">
                          Preview ({uploadedRecipients.length} recipients)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-32">
                          <div className="space-y-2">
                            {uploadedRecipients.slice(0, 5).map((r, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                              >
                                <span className="font-medium">
                                  {r.phoneNumber}
                                </span>
                                <span className="text-muted-foreground">
                                  {r.name}
                                </span>
                              </div>
                            ))}
                            {uploadedRecipients.length > 5 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{uploadedRecipients.length - 5} more recipients
                              </p>
                            )}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Rate Limiting & Delay */}
            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <Label>Sending Speed Configuration</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Configure delay between messages to prevent WhatsApp
                    blocking
                  </p>

                  {/* Rate Limit Presets */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(
                      Object.keys(RATE_LIMIT_PRESETS) as Array<
                        keyof typeof RATE_LIMIT_PRESETS
                      >
                    ).map((preset) => (
                      <Button
                        key={preset}
                        variant={
                          selectedRateLimit === preset ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedRateLimit(preset)}
                        className="capitalize"
                      >
                        {preset}
                      </Button>
                    ))}
                  </div>

                  {/* Current Configuration */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Messages/Second
                          </p>
                          <p className="text-lg font-bold">
                            {rateLimitConfig.messagesPerSecond}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Messages/Minute
                          </p>
                          <p className="text-lg font-bold">
                            {rateLimitConfig.messagesPerMinute}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Messages/Hour
                          </p>
                          <p className="text-lg font-bold">
                            {rateLimitConfig.messagesPerHour}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Daily Limit
                          </p>
                          <p className="text-lg font-bold">
                            {rateLimitConfig.messagesPerDay}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Custom Delay */}
                  <div className="mt-4">
                    <Label htmlFor="delay">
                      Delay Between Messages (seconds)
                    </Label>
                    <div className="flex items-center gap-3 mt-2">
                      <Input
                        id="delay"
                        type="number"
                        min="0.5"
                        max="60"
                        step="0.5"
                        value={messageDelay}
                        onChange={(e) =>
                          setMessageDelay(Number(e.target.value))
                        }
                        className="w-32"
                      />
                      <div className="flex-1">
                        <Progress
                          value={Math.min((messageDelay / 10) * 100, 100)}
                          className="h-2"
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {messageDelay}s
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Recommended: 1-3 seconds to avoid rate limiting
                    </p>
                  </div>

                  {/* Estimated Time */}
                  {uploadedRecipients.length > 0 && (
                    <Card className="bg-blue-600/5 border-blue-600/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium">
                              Estimated Duration
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {Math.ceil(
                                (uploadedRecipients.length * messageDelay) / 60,
                              )}{" "}
                              minutes for {uploadedRecipients.length} recipients
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Review & Launch */}
            {step === 6 && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Campaign Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Campaign Name
                        </p>
                        <p className="text-sm font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Client</p>
                        <p className="text-sm font-medium">
                          {selectedClient?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Template
                        </p>
                        <p className="text-sm font-medium">
                          {selectedTemplate?.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Recipients
                        </p>
                        <p className="text-sm font-medium">
                          {uploadedRecipients.length}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Rate Limit
                        </p>
                        <p className="text-sm font-medium capitalize">
                          {selectedRateLimit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Message Delay
                        </p>
                        <p className="text-sm font-medium">{messageDelay}s</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Template Preview */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Message Preview (with sample data)
                      </p>
                      <Card className="bg-muted/50">
                        <CardContent className="p-3">
                          <p className="text-sm whitespace-pre-wrap">
                            {selectedTemplate?.content.replace(
                              /{(\w+)}/g,
                              (_match: string, key: string) =>
                                `[${key.toUpperCase()}]`,
                            )}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Warnings */}
                    <Card className="bg-orange-600/5 border-orange-600/20">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                          <div className="text-xs">
                            <p className="font-medium text-orange-600">
                              Important Notes:
                            </p>
                            <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                              <li>
                                Ensure all recipients have opted in to receive
                                messages
                              </li>
                              <li>Campaign cannot be stopped once started</li>
                              <li>
                                Failed messages will be retried automatically
                              </li>
                              <li>
                                Estimated duration: ~
                                {Math.ceil(
                                  (uploadedRecipients.length * messageDelay) /
                                    60,
                                )}{" "}
                                minutes
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 6 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed()}>
                <Send className="h-4 w-4 mr-2" />
                Launch Campaign
              </Button>
            )}
          </div>
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
