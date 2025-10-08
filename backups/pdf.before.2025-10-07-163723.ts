import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

// --- Mise en page ---
const A4: [number, number] = [595.28, 841.89];
const [PAGE_W, PAGE_H] = A4;
const M = 50;
const LINE = 14;
const RIGHT_COL = PAGE_W - M - 8; // Colonne unique d'alignement à droite

// --- Helpers ---
const eur = (n: number) => (n ?? 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const safe = (s: string) => (s ?? "").replace(/\u202F|\u00A0/g, " ");

const fontPathRegular = () => {
  const p = path.join(process.cwd(), "public", "fonts", "DejaVuSans.ttf");
  if (!fs.existsSync(p)) throw new Error("Police introuvable: public/fonts/DejaVuSans.ttf");
  return p;
};
const fontPathBold = () => path.join(process.cwd(), "public", "fonts", "DejaVuSans-Bold.ttf");

function loadLogo(): { bytes: Uint8Array | Buffer; kind: "png" | "jpg" } | null {
  const base = path.join(process.cwd(), "public");
  const png = path.join(base, "logo-batige.png");
  const jpg = path.join(base, "logo-batige.jpg");
  const jpeg = path.join(base, "logo-batige.jpeg");
  if (fs.existsSync(png)) return { bytes: fs.readFileSync(png), kind: "png" };
  if (fs.existsSync(jpg)) return { bytes: fs.readFileSync(jpg), kind: "jpg" };
  if (fs.existsSync(jpeg)) return { bytes: fs.readFileSync(jpeg), kind: "jpg" };
  return null;
}

function wrapText(text: string, size: number, maxWidth: number, font: any): string[] {
  const words = safe(text).split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = (cur ? cur + " " : "") + w;
    const width = font.widthOfTextAtSize(test, size);
    if (width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const ppId = Number(params.id);
    if (!ppId) return NextResponse.json({ error: "id manquant" }, { status: 400 });

    // --- Données ---
    const pp = await prisma.propositionPaiement.findUnique({
      where: { id: ppId },
      include: {
        facture: { include: { marche: { include: { project: true, entreprise: true, dpgf: true } } } },
        lines: { include: { dpgfLine: true } },
      },
    });
    if (!pp) return NextResponse.json({ error: "PP introuvable" }, { status: 404 });

    const marche = pp.facture.marche as any;
    const projectName = marche.project?.name ?? marche.project?.nom ?? "";
    const entrepriseName = marche.entreprise?.name ?? marche.entreprise?.nom ?? "";
    const marcheRef = marche.reference ?? marche.nom ?? `#${marche.id}`;
    const refPP = pp.numero ?? `PP-${pp.id}`;

    const montantMarche = (marche.dpgf ?? []).reduce((s: number, l: any) => s + Number(l.totalHt ?? 0), 0);

    let totalAvenants = 0;
    try {
      const avs = await (prisma as any).avenant.findMany({ where: { marcheId: marche.id } });
      totalAvenants = (avs || []).reduce((s: number, a: any) => s + Number(a.totalHt ?? a.montant ?? 0), 0);
    } catch {}

    const marcheRevise = montantMarche + totalAvenants;

    const cumulPrecedent = await (async () => {
      const prev = await prisma.propositionPaiement.findMany({
        where: { id: { lt: pp.id }, lines: { some: { dpgfLine: { marcheId: marche.id } } } },
        include: { lines: true },
      });
      return prev.reduce((s, p) => s + (p.lines || []).reduce((ss, l) => ss + Number(l.currentHt ?? 0), 0), 0);
    })();

    const courantHt = (pp.lines || []).reduce((s, l) => s + Number(l.currentHt ?? 0), 0);
    const cumulEnCours = cumulPrecedent + courantHt;
    const tvaRate = 0.2;
    const tva = courantHt * tvaRate;
    const ttc = courantHt + tva;
    const tauxAvancement = marcheRevise > 0 ? (cumulEnCours / marcheRevise) * 100 : 0;

    // --- PDF ---
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);

    const fontReg = await pdf.embedFont(fs.readFileSync(fontPathRegular()), { subset: true });
    const hasBold = fs.existsSync(fontPathBold());
    const fontBold = hasBold ? await pdf.embedFont(fs.readFileSync(fontPathBold()), { subset: true }) : fontReg;

    let page = pdf.addPage(A4);
    let y = PAGE_H - M;
    let pageNo = 1;

    const draw = (txt: string, x = M, size = 10) => {
      page.drawText(safe(txt), { x, y, size, font: fontReg, color: rgb(0,0,0) });
      y -= LINE;
    };
    const right = (txt: string, size = 10, fontUsed = fontReg) => {
      const t = safe(txt);
      const w = fontUsed.widthOfTextAtSize(t, size);
      page.drawText(t, { x: RIGHT_COL - w, y, size, font: fontUsed, color: rgb(0,0,0) });
    };
    const row = (label: string, value: string, size = 10, indent = 0) => {
      page.drawText(safe(label), { x: M + indent, y, size, font: fontReg });
      right(value, size, fontReg);
      y -= LINE;
    };
    const hr = (gapTop = 8, gapBottom = 10) => {
      y -= gapTop;
      page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
      y -= gapBottom;
    };
    const addFooter = () => {
      const footer = `Page ${pageNo}`;
      page.drawText(footer, { x: PAGE_W - M - fontReg.widthOfTextAtSize(footer,9), y: M-18, size: 9, font: fontReg, color: rgb(0.5,0.5,0.5) });
    };
    const newPage = (subtitle?: string) => {
      addFooter();
      page = pdf.addPage(A4);
      pageNo++;
      y = PAGE_H - M;
      if (subtitle) { page.drawText(subtitle, { x: M, y, size: 12, font: fontReg }); y -= LINE; }
      page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
      y -= 8;
    };

    // Logo en haut à gauche
    try {
      const logo = loadLogo();
      if (logo) {
        const img = logo.kind === "png" ? await pdf.embedPng(logo.bytes) : await pdf.embedJpg(logo.bytes);
        let w = 220, h = (img.height / img.width) * w;
        if (h > 80) { const r = 80 / h; w *= r; h *= r; }
        page.drawImage(img, { x: M, y: PAGE_H - M - h + 8, width: w, height: h });
        y = PAGE_H - M - h - 6;
      }
    } catch {}

    // Titre
    y -= 6;
    page.drawText("CERTIFICAT DE PAIEMENT", { x: M, y, size: 18, font: fontReg, color: rgb(0,0,0) });
    y -= 30;

    // En-tête
    draw(`Maître d'ouvrage / Projet : ${projectName}`);
    draw(`Entreprise : ${entrepriseName}`);
    draw(`Devis : ${marcheRef}`);
    draw(`Numéro de PP : ${refPP}`);
    hr();

    // Récapitulatif Marché
    page.drawText("Récapitulatif Marché", { x: M, y, size: 12, font: fontReg }); y -= LINE;
    row("Montant du Marché (HT) :", eur(montantMarche));
    row("Avenants (HT) :", eur(totalAvenants));
    row("Total Marché révisé (HT) :", eur(marcheRevise));
    hr();

    // Situation des travaux
    page.drawText("Situation des travaux", { x: M, y, size: 12, font: fontReg }); y -= LINE;
    row("Cumul H.T. précédent :", eur(cumulPrecedent));
    row("Situation H.T. en cours :", eur(courantHt));
    row("Cumul H.T. en cours :", eur(cumulEnCours));
    hr();

    // Bloc NET À PAYER
    const boxTop = y - 6;
    const boxH = 4 * LINE + 24;
    const boxW = PAGE_W - 2 * M;
    page.drawRectangle({
      x: M, y: boxTop - boxH, width: boxW, height: boxH,
      color: rgb(0.96,0.96,0.96), borderColor: rgb(0.7,0.7,0.7), borderWidth: 0.5
    });
    y = boxTop - 12;
    page.drawText("MONTANT DU CERTIFICAT DE PAIEMENT (NET À PAYER)", { x: M + 8, y, size: 12, font: fontReg });
    y -= LINE + 2;

    // Lignes alignées (même colonne RIGHT_COL)
    row("H.T. :", eur(courantHt), 12, 12);
    row(`T.V.A. ${(tvaRate * 100).toFixed(0)} % :`, eur(tva), 12, 12);

    // TTC : gras + souligné mais même alignement
    page.drawText("T.T.C. :", { x: M + 12, y, size: 12, font: fontReg, color: rgb(0,0,0) });
    const ttcStr = eur(ttc);
    const ttcFont = hasBold ? fontBold : fontReg;
    const ttcW = ttcFont.widthOfTextAtSize(ttcStr, 12);
    const ttcX = RIGHT_COL - ttcW;
    page.drawText(ttcStr, { x: ttcX, y, size: 12, font: ttcFont, color: rgb(0,0,0) });
    page.drawLine({ start: { x: ttcX, y: y - 2 }, end: { x: ttcX + ttcW, y: y - 2 }, thickness: 0.7, color: rgb(0,0,0) });

    y -= LINE + 10;
    draw(`Taux d'avancement cumulé / marché en % : ${tauxAvancement.toFixed(2)}`);
    addFooter();

    // ANNEXES — Détail lignes
    const lines = (pp.lines || []).map((l: any) => ({
      code: l.dpgfLine?.code ?? "",
      desc: l.dpgfLine?.description ?? l.dpgfLine?.libelle ?? "",
      amt: Number(l.currentHt ?? 0),
    }));

    if (lines.length > 0) {
      const headerAnnexe = "Annexe — Détail (PP en cours)";
      const headerAnnexeSuite = "Annexe — Détail (PP en cours) (suite)";

      const addHeader = (title: string) => {
        page.drawText(title, { x: M, y, size: 12, font: fontReg }); y -= LINE;
        page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
        y -= 8;
      };

      const colCode = M;
      const colDesc = M + 70;
      const colAmt  = RIGHT_COL;
      const descWidth = colAmt - 12 - colDesc;

      const startNew = (title: string) => {
        addFooter();
        page = pdf.addPage(A4);
        pageNo++;
        y = PAGE_H - M;
        page.drawText(title, { x: M, y, size: 12, font: fontReg }); y -= LINE;
        page.drawLine({ start: { x: M, y }, end: { x: PAGE_W - M, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
        y -= 8;
      };

      startNew(headerAnnexe);

      for (const r of lines) {
        if (y < 90) startNew(headerAnnexeSuite);

        const descLines = wrapText(`${r.code ? r.code + " — " : ""}${r.desc}`, 10, descWidth, fontReg);

        page.drawText(r.code || "", { x: colCode, y, size: 10, font: fontReg });
        page.drawText(descLines[0] || "", { x: colDesc, y, size: 10, font: fontReg });

        const amtStr = eur(r.amt);
        const aw = fontReg.widthOfTextAtSize(amtStr, 10);
        page.drawText(amtStr, { x: colAmt - aw, y, size: 10, font: fontReg });

        y -= LINE;

        for (let i = 1; i < descLines.length; i++) {
          if (y < 90) startNew(headerAnnexeSuite);
          page.drawText(descLines[i], { x: colDesc, y, size: 10, font: fontReg });
          y -= LINE;
        }

        page.drawLine({ start: { x: M, y: y + 4 }, end: { x: PAGE_W - M, y: y + 4 }, thickness: 0.25, color: rgb(0.9,0.9,0.9) });
        y -= 6;
      }

      addFooter();
    }

    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="PP-${ppId}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur PDF" }, { status: 500 });
  }
}
