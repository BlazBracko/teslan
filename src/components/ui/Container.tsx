import { cn } from "@/lib/utils";

/**
 * Vsebnik strani (Z3): sredinska širina in robni odmik iz tokenov
 * (`--container-*`, `--spacing-gutter*`). `prose` za berljivo dolžino
 * vrstice (pravne strani, opisi), `content` za mreže, `wide` za glavo in
 * nogo.
 */
const sirine = {
  prose: "max-w-prose",
  content: "max-w-content",
  wide: "max-w-wide",
} as const;

export function Container({
  size = "content",
  as: Element = "div",
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  size?: keyof typeof sirine;
  as?: "div" | "section" | "header" | "footer" | "nav" | "article";
}) {
  return <Element className={cn("mx-auto w-full px-gutter lg:px-gutter-lg", sirine[size], className)} {...props} />;
}

/** Navpični ritem med sekcijami strani. */
export function Section({
  className,
  tone = "canvas",
  ...props
}: React.HTMLAttributes<HTMLElement> & { tone?: "canvas" | "surface" | "muted" }) {
  return (
    <section
      className={cn(
        "py-section lg:py-section-lg",
        tone === "surface" && "bg-surface",
        tone === "muted" && "bg-surface-muted",
        className,
      )}
      {...props}
    />
  );
}
