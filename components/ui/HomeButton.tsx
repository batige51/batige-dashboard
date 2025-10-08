"use client";

import { Button } from "@/components/ui/button";

export default function HomeButton() {
  return (
    <div className="mb-6 flex justify-end">
      <Button asChild variant="outline">
        <a href="/">🏠 Accueil</a>
      </Button>
    </div>
  );
}
