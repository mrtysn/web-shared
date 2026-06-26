import type { ReactNode } from "react";
import { Tag } from "./Tag";
import { Badge } from "./Badge";

export interface CardProps {
  title: ReactNode;
  href?: string;
  /** Pass "" to explicitly show an empty-description marker; omit to show nothing. */
  description?: string;
  tags?: string[];
  badges?: string[];
  /** Dim + dashed border, e.g. for "missing" items. */
  muted?: boolean;
  children?: ReactNode;
}

export function Card({ title, href, description, tags, badges, muted, children }: CardProps) {
  const titleEl = href ? (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {title}
    </a>
  ) : (
    title
  );
  return (
    <article className={`ws-card${muted ? " ws-card--muted" : ""}`}>
      <div className="ws-card__head">
        <span className="ws-card__title">{titleEl}</span>
        {badges?.map((b) => <Badge key={b} label={b} />)}
      </div>
      {description !== undefined && (
        <div className={`ws-card__desc${description ? "" : " ws-card__desc--empty"}`}>
          {description || "no description"}
        </div>
      )}
      {tags && tags.length > 0 && (
        <div className="ws-tags">
          {tags.map((t) => (
            <Tag key={t} label={t} />
          ))}
        </div>
      )}
      {children}
    </article>
  );
}
