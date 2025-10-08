"use client";

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2, Home, Landmark, Factory, Warehouse, Hotel, Store, School, Trash2,
  Calendar, MapPin, Euro
} from "lucide-react";

export type ProjectCardData = {
  id: number;
  name: string;
  status?: "EN_PREPARATION" | "EN_COURS" | "CLOS";
  companyName?: string | null;
  addressLabel?: string | null;
  startDateLabel?: string | null;
  endDateLabel?: string | null;
  budgetLabel?: string | null;
};

function pickIcon(name: string) {
  const icons = [Building2, Home, Landmark, Factory, Warehouse, Hotel, Store, School];
  // petit hash déterministe basé sur le nom
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return icons[h % icons.length];
}

export function StatusBadge({ status }: { status?: ProjectCardData["status"] }) {
  const map: Record<string, { label: string; cls: string }> = {
    EN_PREPARATION: { label: "en préparation", cls: "bg-yellow-100 text-yellow-800" },
    EN_COURS: { label: "en cours", cls: "bg-green-100 text-green-800" },
    CLOS: { label: "terminé", cls: "bg-slate-200 text-slate-800" },
  };
  const { label, cls } = map[status ?? "EN_PREPARATION"];
  return <span className={`px-2 py-0.5 text-xs rounded-full ${cls}`}>{label}</span>;
}

export default function ProjectCard({
  data,
  onDelete,
}: {
  data: ProjectCardData;
  onDelete?: (id: number) => void;
}) {
  const { id, name, status, companyName, addressLabel, startDateLabel, endDateLabel, budgetLabel } = data;
  const Icon = pickIcon(name);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">{name}</CardTitle>
              <div className="mt-1"><StatusBadge status={status} /></div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/projects/${id}`}>Ouvrir</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/projects/${id}/budget`}>Budget</a>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete?.(id)}
              title="Supprimer le projet"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="text-sm text-muted-foreground space-y-2">
        {companyName && (
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>{companyName}</span>
          </div>
        )}
        {addressLabel && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{addressLabel}</span>
          </div>
        )}
        {(startDateLabel || endDateLabel) && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>
              {startDateLabel ? startDateLabel : "—"} {endDateLabel ? " → " + endDateLabel : ""}
            </span>
          </div>
        )}
        {budgetLabel && (
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            <span>{budgetLabel}</span>
          </div>
        )}
        <CardDescription className="mt-2">Projet #{id}</CardDescription>
      </CardContent>
    </Card>
  );
}
