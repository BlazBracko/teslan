import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Payload } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { User } from "@/payload-types";
import { payloadNaCistiBazi } from "@/test/payload";

/**
 * Integracija s Postgres (Z80, Z83): vloge, dostop do uporabnikov, mediji.
 * Vse operacije v imenu uporabnika tečejo z `overrideAccess: false`, torej
 * z enakimi pravili kot v adminu in REST API.
 */

let payload: Payload;
let admin: User;
let urednik: User;

const slika = readFileSync(join(process.cwd(), "public/logo.png"));

beforeAll(async () => {
  payload = await payloadNaCistiBazi();

  // Prvi uporabnik postane admin, tudi če zahteva drugo vlogo.
  admin = await payload.create({
    collection: "users",
    data: {
      ime: "Prvi Admin",
      email: "admin@teslan.test",
      password: "geslo-admina-123",
      vloga: "urednik",
    },
  });
  urednik = await payload.create({
    collection: "users",
    data: {
      ime: "Sandi Urednik",
      email: "urednik@teslan.test",
      password: "geslo-urednika-123",
      vloga: "urednik",
    },
    user: admin,
    overrideAccess: false,
  });
}, 60_000);

afterAll(async () => {
  await payload?.delete({
    collection: "media",
    where: { id: { exists: true } },
  });
  await payload?.destroy();
});

describe("uporabniki in vloge (Z80)", () => {
  it("prvi uporabnik je vedno admin, naslednji privzeto urednik", () => {
    expect(admin.vloga).toBe("admin");
    expect(urednik.vloga).toBe("urednik");
  });

  it("admin vidi vse uporabnike", async () => {
    const { totalDocs } = await payload.find({
      collection: "users",
      user: admin,
      overrideAccess: false,
    });
    expect(totalDocs).toBe(2);
  });

  it("urednik vidi samo svoj račun", async () => {
    const { docs } = await payload.find({
      collection: "users",
      user: urednik,
      overrideAccess: false,
    });
    expect(docs.map((d) => d.id)).toEqual([urednik.id]);
  });

  it("urednik ne more ustvariti uporabnika", async () => {
    await expect(
      payload.create({
        collection: "users",
        data: {
          ime: "Vsiljivec",
          email: "x@teslan.test",
          password: "geslo-vsiljivca-1",
          vloga: "admin",
        },
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow();
  });

  it("urednik ureja svoj račun, vloge pa si ne more spremeniti", async () => {
    const posodobljen = await payload.update({
      collection: "users",
      id: urednik.id,
      data: { ime: "Sandi Derčar", vloga: "admin" },
      user: urednik,
      overrideAccess: false,
    });
    expect(posodobljen.ime).toBe("Sandi Derčar");
    expect(posodobljen.vloga).toBe("urednik");
  });

  it("urednik ne more urejati ali brisati drugih uporabnikov", async () => {
    await expect(
      payload.update({
        collection: "users",
        id: admin.id,
        data: { ime: "Spremenjen" },
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow();
    await expect(
      payload.delete({
        collection: "users",
        id: admin.id,
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow();
    const nespremenjen = await payload.findByID({ collection: "users", id: admin.id });
    expect(nespremenjen.ime).toBe("Prvi Admin");
  });

  it("admin lahko uredniku dodeli vlogo", async () => {
    const drugi = await payload.create({
      collection: "users",
      data: {
        ime: "Drugi",
        email: "drugi@teslan.test",
        password: "geslo-drugega-123",
        vloga: "urednik",
      },
      user: admin,
      overrideAccess: false,
    });
    const povisan = await payload.update({
      collection: "users",
      id: drugi.id,
      data: { vloga: "admin" },
      user: admin,
      overrideAccess: false,
    });
    expect(povisan.vloga).toBe("admin");
  });
});

describe("mediji (Z83)", () => {
  const datoteka = {
    data: slika,
    mimetype: "image/png",
    name: "logo-test.png",
    size: slika.length,
  };

  it("opis slike (alt) je obvezen", async () => {
    await expect(
      payload.create({
        collection: "media",
        data: {} as never,
        file: datoteka,
        user: urednik,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/alt|Opis slike/i);
  });

  it("urednik naloži sliko na lokalni disk, ko R2 ni nastavljen", async () => {
    const medij = await payload.create({
      collection: "media",
      data: { alt: "Logotip Domačije Tešlan" },
      file: datoteka,
      user: urednik,
      overrideAccess: false,
    });
    expect(medij.url).toMatch(/^\/api\/media\/file\/logo-test.*\.png$/);
    expect(medij.width).toBeGreaterThan(0);
  });

  it("neprijavljen obiskovalec slike bere, nalaga pa ne", async () => {
    const { totalDocs } = await payload.find({
      collection: "media",
      overrideAccess: false,
    });
    expect(totalDocs).toBeGreaterThan(0);
    await expect(
      payload.create({
        collection: "media",
        data: { alt: "Ne sme" },
        file: { ...datoteka, name: "ne-sme.png" },
        overrideAccess: false,
      }),
    ).rejects.toThrow();
  });
});
