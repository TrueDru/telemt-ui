"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Raw TOML-as-JSON value shape returned by `GET /v1/config` (no `null` — TOML has no null type). */
export type Json = string | number | boolean | Json[] | { [key: string]: Json };

function isPlainObject(v: Json): v is { [key: string]: Json } {
  return typeof v === "object" && !Array.isArray(v);
}

function isPrimitiveArray(v: Json[]): v is (string | number)[] {
  return v.every((x) => typeof x === "string" || typeof x === "number");
}

export function JsonObjectFields({
  value,
  path,
  resetKey,
  onChange,
}: {
  value: { [key: string]: Json };
  path: string[];
  resetKey: number;
  onChange: (path: string[], value: Json) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      {Object.entries(value).map(([key, v]) => (
        <JsonField
          key={key}
          label={key}
          path={[...path, key]}
          value={v}
          resetKey={resetKey}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

function JsonField({
  label,
  path,
  value,
  resetKey,
  onChange,
}: {
  label: string;
  path: string[];
  value: Json;
  resetKey: number;
  onChange: (path: string[], value: Json) => void;
}) {
  if (isPlainObject(value)) {
    return (
      <div className="rounded-md border p-3">
        <div className="text-muted-foreground mb-3 font-mono text-xs font-medium">{label}</div>
        <JsonObjectFields value={value} path={path} resetKey={resetKey} onChange={onChange} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-1.5 sm:grid-cols-[1fr_2fr] sm:items-center sm:gap-3">
      <Label className="text-muted-foreground font-mono text-xs">{path.join(".")}</Label>
      <JsonValueControl value={value} resetKey={resetKey} onChange={(v) => onChange(path, v)} />
    </div>
  );
}

function JsonValueControl({
  value,
  resetKey,
  onChange,
}: {
  value: Json;
  resetKey: number;
  onChange: (value: Json) => void;
}) {
  if (typeof value === "boolean") {
    return <Switch checked={value} onCheckedChange={onChange} />;
  }

  if (typeof value === "number") {
    return (
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0 || isPrimitiveArray(value)) {
      const isNumeric = value.length > 0 && value.every((x) => typeof x === "number");
      return (
        <ArrayTextarea
          key={resetKey}
          value={value as (string | number)[]}
          isNumeric={isNumeric}
          onChange={onChange}
        />
      );
    }
    return <RawJsonTextarea key={resetKey} value={value} onChange={onChange} />;
  }

  if (typeof value === "string") {
    return <Input className="font-mono" value={value} onChange={(e) => onChange(e.target.value)} />;
  }

  return <RawJsonTextarea key={resetKey} value={value} onChange={onChange} />;
}

function ArrayTextarea({
  value,
  isNumeric,
  onChange,
}: {
  value: (string | number)[];
  isNumeric: boolean;
  onChange: (value: Json) => void;
}) {
  return (
    <Textarea
      className="font-mono text-xs"
      rows={Math.min(6, Math.max(2, value.length))}
      placeholder="one entry per line"
      defaultValue={value.join("\n")}
      onChange={(e) => {
        const lines = e.target.value
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => l.length > 0);
        onChange(isNumeric ? lines.map(Number).filter((n) => !Number.isNaN(n)) : lines);
      }}
    />
  );
}

function RawJsonTextarea({ value, onChange }: { value: Json; onChange: (value: Json) => void }) {
  const [text, setText] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <Textarea
        className={cn("font-mono text-xs", error && "border-destructive")}
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          try {
            onChange(JSON.parse(e.target.value) as Json);
            setError(false);
          } catch {
            setError(true);
          }
        }}
      />
      {error && <p className="text-destructive text-xs">Invalid JSON — not saved until fixed.</p>}
    </div>
  );
}
