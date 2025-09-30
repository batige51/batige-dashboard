"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    (async ()=>{
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
    })();
  },[]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projets</h1>
        <Link href="/projects/new" className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Nouveau projet
        </Link>
      </div>

      <div className="rounded border bg-white overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Nom</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-2" colSpan={3}>Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td className="px-3 py-2 text-slate-600" colSpan={3}>Aucun projet.</td></tr>
            ) : items.map((p:any)=>(
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2">{p.id}</td>
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">
                  <Link href={`/budget/${p.id}`} className="text-blue-600 hover:underline">Budget</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
