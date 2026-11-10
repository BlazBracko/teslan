import type { Metadata } from "next";
import Link from "next/link";
import { LuSearch } from "react-icons/lu";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Strani ni mogoče najti",
  robots: { index: false },
};

/** 404 javnih strani (npr. neobstoječ ali neobjavljen izdelek). */
export default function NotFound() {
  return (
    <Container size="prose" className="py-section">
      <EmptyState
        icon={<LuSearch />}
        titleAs="h1"
        title="Strani ni mogoče najti"
        description="Povezava je morda zastarela ali pa izdelek ni več v ponudbi."
        action={
          <Button asChild>
            <Link href="/products">Na seznam izdelkov</Link>
          </Button>
        }
      />
    </Container>
  );
}
