import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const fid = parseInt(id, 10);
  if (isNaN(fid)) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const body = await req.json().catch(()=>null);
  if (!body) return NextResponse.json({ error: "JSON invalide" }, { status: 400 });

  const data: any = {};
  if (body.tvaRate != null)     data.tvaRate = Number(body.tvaRate);
  if (body.retenuePct != null)  data.retenuePct = Number(body.retenuePct);
  if (body.isDgd != null)       data.isDgd = !!body.isDgd;

  const updated = await prisma.facture.update({
    where: { id: fid },
    data,
    select: { id: true, tvaRate: true, retenuePct: true, isDgd: true },
  });

  return NextResponse.json(updated);
}
