import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  parseCSV,
  downloadCSVTemplate,
  RATE_LIMIT_PRESETS,
  calculateETA,
  formatDuration,
  type CSVRecipient,
  type RateLimitConfig,
} from "@/lib/campaign-utils";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Calendar as CalendarIcon,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// CSV Upload Dialog
export function CSVUploadDialog({
  open,
  onOpenChange,
  onUpload,
  templateVariables,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (recipients: CSVRecipient[]) => void;
  templateVariables: string[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsing(true);

    try {
      const parseResult = await parseCSV(selectedFile);
      setResult(parseResult);

      if (parseResult.errors.length > 0) {
        toast.warning(`Parsed with ${parseResult.errors.length} errors`, {
          description: `${parseResult.validRows} valid recipients found`,
        });
      } else {
        toast.success(
          `Successfully parsed ${parseResult.validRows} recipients`,
        );
      }
    } catch (error) {
      toast.error("Failed to parse CSV", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
      setResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleUpload = () => {
    if (result && result.recipients.length > 0) {
      onUpload(result.recipients);
      onOpenChange(false);
      setFile(null);
      setResult(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Recipients (CSV)</DialogTitle>
          <DialogDescription>
            Upload a CSV file with recipient information and template variables
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Need a template?</p>
                  <p className="text-xs text-muted-foreground">
                    Download CSV template with required columns
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCSVTemplate(templateVariables)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <div>
            <Label>Select CSV File</Label>
            <div className="mt-2">
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={parsing}
              />
            </div>
          </div>

          {/* Parsing Results */}
          {result && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Parse Results</span>
                  {result.errors.length === 0 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Rows</p>
                    <p className="text-lg font-bold">{result.totalRows}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valid</p>
                    <p className="text-lg font-bold text-green-600">
                      {result.validRows}
                    </p>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">
                      Errors ({result.errors.length})
                    </p>
                    <ScrollArea className="h-20">
                      <div className="space-y-1">
                        {result.errors
                          .slice(0, 5)
                          .map((err: any, idx: number) => (
                            <p key={idx} className="text-xs text-red-600">
                              Row {err.row}: {err.error}
                            </p>
                          ))}
                        {result.errors.length > 5 && (
                          <p className="text-xs text-muted-foreground">
                            +{result.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!result || result.validRows === 0 || parsing}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload {result?.validRows || 0} Recipients
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Schedule Dialog with Date/Time Picker
export function ScheduleDialog({
  open,
  onOpenChange,
  onSchedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (date: Date) => void;
}) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("12:00");

  const handleSchedule = () => {
    if (!date) return;

    const [hours, minutes] = time.split(":").map(Number);
    const scheduledDate = new Date(date);
    scheduledDate.setHours(hours, minutes, 0, 0);

    if (scheduledDate <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    onSchedule(scheduledDate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Campaign</DialogTitle>
          <DialogDescription>
            Choose when to start sending messages
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Select Date</Label>
            <div className="mt-2 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
          </div>

          <div>
            <Label>Select Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-2"
            />
          </div>

          {date && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Scheduled for</p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString()} at {time}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!date}>
            <Clock className="h-4 w-4 mr-2" />
            Schedule Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Rate Limit Configuration Dialog
export function RateLimitDialog({
  open,
  onOpenChange,
  onSave,
  currentConfig,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: RateLimitConfig) => void;
  currentConfig?: RateLimitConfig;
}) {
  const [preset, setPreset] =
    useState<keyof typeof RATE_LIMIT_PRESETS>("moderate");
  const [config, setConfig] = useState<RateLimitConfig>(
    currentConfig || RATE_LIMIT_PRESETS.moderate,
  );
  const [recipientCount, setRecipientCount] = useState(1000);

  const handlePresetChange = (newPreset: keyof typeof RATE_LIMIT_PRESETS) => {
    setPreset(newPreset);
    setConfig(RATE_LIMIT_PRESETS[newPreset]);
  };

  const eta = calculateETA(recipientCount, config);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rate Limit Configuration</DialogTitle>
          <DialogDescription>
            Configure sending speed to comply with WhatsApp limits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Presets */}
          <div>
            <Label>Preset</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {(
                Object.keys(RATE_LIMIT_PRESETS) as Array<
                  keyof typeof RATE_LIMIT_PRESETS
                >
              ).map((key) => (
                <Button
                  key={key}
                  variant={preset === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePresetChange(key)}
                  className="capitalize"
                >
                  {key}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Current Limits */}
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Per Second</p>
                <p className="text-lg font-bold">{config.messagesPerSecond}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Per Minute</p>
                <p className="text-lg font-bold">{config.messagesPerMinute}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Per Hour</p>
                <p className="text-lg font-bold">{config.messagesPerHour}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Per Day</p>
                <p className="text-lg font-bold">{config.messagesPerDay}</p>
              </CardContent>
            </Card>
          </div>

          {/* ETA Calculator */}
          <Card>
            <CardContent className="p-4">
              <Label className="mb-2 block">Estimate Completion Time</Label>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={recipientCount}
                  onChange={(e) => setRecipientCount(Number(e.target.value))}
                  placeholder="Number of recipients"
                  min={1}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Estimated Duration</p>
                  <p className="text-xs text-muted-foreground">
                    Completes at {eta.completionTime.toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {formatDuration(eta.duration)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(config);
              onOpenChange(false);
            }}
          >
            <Zap className="h-4 w-4 mr-2" />
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
