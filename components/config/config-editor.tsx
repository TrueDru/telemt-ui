"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { JsonObjectFields, type Json } from "@/components/config/json-field";
import { describeError, useConfigQuery, usePatchConfig } from "@/components/config/queries";
import { TelemtApiError } from "@/lib/telemt/errors";
import {
  CONFIG_SECTIONS,
  type ConfigData,
  type ConfigSection,
  type PatchConfigRequest,
} from "@/lib/telemt/schemas/config";
import type { TelemtResult } from "@/lib/telemt/client";

const SECTION_LABELS: Record<ConfigSection, string> = {
  general: "General",
  timeouts: "Timeouts",
  censorship: "Censorship",
  upstreams: "Upstreams",
  show_link: "Share links",
  dc_overrides: "DC overrides",
};

/** Sections that always need a restart per API.md; `general` only if `modes` changes. */
const RESTART_SECTIONS = new Set<ConfigSection>(["timeouts", "censorship", "upstreams"]);

function isPlainObj(v: Json | undefined): v is { [key: string]: Json } {
  return typeof v === "object" && v != null && !Array.isArray(v);
}

function setAtPath(
  obj: { [key: string]: Json },
  path: string[],
  value: Json,
): { [key: string]: Json } {
  const [head, ...rest] = path;
  if (rest.length === 0) return { ...obj, [head]: value };
  const child = obj[head];
  return { ...obj, [head]: setAtPath(isPlainObj(child) ? child : {}, rest, value) };
}

export function ConfigEditor({
  instanceId,
  initial,
}: {
  instanceId: string;
  initial?: TelemtResult<ConfigData> | null;
}) {
  const { data, isError, error, refetch } = useConfigQuery(instanceId, initial ?? undefined);
  const patchConfig = usePatchConfig(instanceId);

  const [draft, setDraft] = useState<ConfigData | null>(() =>
    initial ? structuredClone(initial.data) : null,
  );
  const [resetKey, setResetKey] = useState(0);
  const [activeTab, setActiveTab] = useState<ConfigSection | undefined>();
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [conflict, setConflict] = useState(false);
  const [restartNotice, setRestartNotice] = useState<string[] | null>(null);

  const base = data?.data;

  const reload = async () => {
    const res = await refetch();
    if (res.data) {
      setDraft(structuredClone(res.data.data));
      setResetKey((k) => k + 1);
    }
    setConflict(false);
  };

  if (isError || !base || !draft) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader />
        <Card className="p-6">
          <EmptyState
            icon={Settings2}
            title="Couldn't load config"
            description={isError ? describeError(error) : "No config data available."}
          />
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={reload}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const sections = CONFIG_SECTIONS.filter((s) => base[s] !== undefined);
  const dirtySections = sections.filter(
    (s) => JSON.stringify(draft[s]) !== JSON.stringify(base[s]),
  );
  const isDirty = dirtySections.length > 0;
  const restartSections = dirtySections.filter(
    (s) =>
      RESTART_SECTIONS.has(s) ||
      (s === "general" &&
        JSON.stringify(draft.general?.modes) !== JSON.stringify(base.general?.modes)),
  );
  const predictedRestart = restartSections.length > 0;

  const onFieldChange = (section: ConfigSection, path: string[], value: Json) => {
    setDraft((d) => {
      if (!d) return d;
      const current = (d[section] ?? {}) as { [key: string]: Json };
      return { ...d, [section]: setAtPath(current, path, value) };
    });
  };

  const discard = () => {
    setDraft(structuredClone(base));
    setResetKey((k) => k + 1);
  };

  const doSave = () => {
    setConfirmRestart(false);
    const body: Record<string, unknown> = {};
    for (const s of dirtySections) body[s] = draft[s];
    patchConfig.mutate(
      { body: body as unknown as PatchConfigRequest, ifMatch: data.revision },
      {
        onSuccess: (res) => {
          setRestartNotice(res.data.restart_required ? res.data.changed : null);
          toast.success("Config saved");
        },
        onError: (err) => {
          if (err instanceof TelemtApiError && err.code === "revision_conflict") {
            setConflict(true);
          } else {
            toast.error(describeError(err));
          }
        },
      },
    );
  };

  const onSaveClick = () => {
    if (predictedRestart) setConfirmRestart(true);
    else doSave();
  };

  const tab = activeTab && sections.includes(activeTab) ? activeTab : sections[0];

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader />

      {restartNotice && (
        <Card className="border-amber-500/50 bg-amber-500/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Restart required</div>
              <p className="text-muted-foreground text-xs">
                Saved {restartNotice.join(", ")} changes were written to disk but need a manual
                telemt restart on this instance to take effect.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setRestartNotice(null)}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => setActiveTab(v as ConfigSection)}>
        <TabsList>
          {sections.map((s) => (
            <TabsTrigger key={s} value={s} className="gap-1.5">
              {SECTION_LABELS[s]}
              {dirtySections.includes(s) && <span className="bg-primary size-1.5 rounded-full" />}
            </TabsTrigger>
          ))}
        </TabsList>
        {sections.map((s) => (
          <TabsContent key={s} value={s} className="pt-3">
            <Card className="p-4">
              <JsonObjectFields
                value={(draft[s] ?? {}) as { [key: string]: Json }}
                path={[]}
                resetKey={resetKey}
                onChange={(path, value) => onFieldChange(s, path, value)}
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {isDirty && (
        <div className="bg-card sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-lg border p-3 shadow-lg">
          <div className="text-sm">
            <span className="font-medium">{dirtySections.length}</span> section
            {dirtySections.length > 1 ? "s" : ""} changed:{" "}
            <span className="text-muted-foreground font-mono text-xs">
              {dirtySections.map((s) => SECTION_LABELS[s]).join(", ")}
            </span>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={discard}>
              Discard
            </Button>
            <Button onClick={onSaveClick} disabled={patchConfig.isPending}>
              {patchConfig.isPending
                ? "Saving…"
                : predictedRestart
                  ? "Save & flag restart"
                  : "Save changes"}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmRestart} onOpenChange={setConfirmRestart}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restart required for these changes</AlertDialogTitle>
            <AlertDialogDescription>
              Changes to {restartSections.map((s) => SECTION_LABELS[s]).join(", ")} are written to
              disk immediately but only take effect after a manual telemt restart on this instance.
              Active connections may be dropped on restart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={doSave}>Save anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={conflict} onOpenChange={setConflict}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Config changed on the server</AlertDialogTitle>
            <AlertDialogDescription>
              This config was modified since you loaded it. Reload to get the latest version — your
              unsaved edits will be discarded.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={reload}>Reload</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-lg font-semibold">Config</h1>
      <p className="text-muted-foreground text-sm">
        Edit the live server configuration. Restart-required changes are written to disk immediately
        but need a manual restart to take effect.
      </p>
    </div>
  );
}
