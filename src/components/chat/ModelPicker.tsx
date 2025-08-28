import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ModelOption = { id: string; label: string };

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-5-2025-08-07", label: "GPT-5 - smartest" },
  { id: "gpt-4.1-2025-04-14", label: "GPT-4.1 - best research" },
  { id: "gpt-4o-mini", label: "GPT-4o-mini - fastest" },
  { id: "gpt-3.5-turbo", label: "GPT-3.5 - most economic" },
];

export function ModelPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select a model" />
      </SelectTrigger>
      <SelectContent className="z-50">
        {MODEL_OPTIONS.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
