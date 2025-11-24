import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface BlessingCardProps {
  title: string;
  description: string;
  options: string[];
}

export function GodBlessingCard({ title, description, options }: BlessingCardProps) {
  const [selected, setSelected] = useState(options[0]);
  const [intensity, setIntensity] = useState([50]);

  return (
    <Card className="border border-primary/20 bg-card/80">
      <CardHeader>
        <CardTitle className="font-serif text-xl">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger>
            <SelectValue placeholder="Select effect" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Intensity</p>
          <Slider value={intensity} onValueChange={setIntensity} />
        </div>
      </CardContent>
    </Card>
  );
}

