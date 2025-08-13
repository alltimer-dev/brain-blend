import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ModelOption = { id: string; label: string };

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  { id: "gpt-4o", label: "GPT-4" },
  { id: "gpt-5", label: "GPT-5" },
  { id: "grok-2", label: "Grok 3" },
  { id: "grok-2-latest", label: "Grok 4" },
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
