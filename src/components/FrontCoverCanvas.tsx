"use client";

import type { ReactNode } from "react";
import type { FrontCoverLayout } from "@/lib/binder-content";
import { ReqText } from "@/components/RichText";

type Props = {
  abbreviation: string;
  sjif: string;
  icv: string;
  eIssn: string;
  issueLine: string;
  website: string;
  title: string;
  titleClassName: string;
  monthRange: string;
  coverImage?: string;
  publisherMark: ReactNode;
  excellenceMark: ReactNode;
  // Retained so existing call sites keep compiling; the cover layout is now
  // fixed (locked), so these no longer drive positioning.
  layout?: FrontCoverLayout;
  interactive?: boolean;
  onLayoutChange?: (layout: FrontCoverLayout) => void;
};

// Fixed-layout front-cover overlay rendered above the cover image. Journal
// metadata flows in a header zone (top meta row + a title/issue row); the
// publisher and journal logos are pinned to the footer.
export default function FrontCoverCanvas({
  abbreviation,
  sjif,
  icv,
  eIssn,
  issueLine,
  website,
  title,
  titleClassName,
  monthRange,
  coverImage,
  publisherMark,
  excellenceMark,
}: Props) {
  return (
    <div className="front-cover-dynamic-layer">
      <div className="front-cover-header">
        <div className="front-cover-top">
          <div className="front-cover-top-left">
            <ReqText className="front-cover-abbreviation-badge" value={abbreviation} label="Abbreviation" />
            {/* SJIF / ICV are optional — the whole line is hidden when unset. */}
            {sjif.trim() ? <div className="front-cover-meta-line">SJIF: {sjif}</div> : null}
            {icv.trim() ? <div className="front-cover-meta-line">ICV: {icv}</div> : null}
          </div>
          <div className="front-cover-top-right">
            {/* e-ISSN is optional — the whole line is hidden when unset. */}
            {eIssn.trim() ? <div className="front-cover-issn">ISSN: {eIssn}</div> : null}
            <div className="front-cover-issue-line">{issueLine}</div>
            <div className="front-cover-website-line">{website}</div>
          </div>
        </div>
        <div className="front-cover-title-row">
          <ReqText className={`front-cover-title ${titleClassName}`} value={title} label="Journal title" />
          <div className="front-cover-month">{monthRange}</div>
        </div>
      </div>
      {/* Middle section: the cover artwork is confined here, between the header
          and the footer (it no longer bleeds behind them). */}
      <div className="front-cover-middle">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="front-cover-middle-image" src={coverImage} alt={title} crossOrigin="anonymous" />
        ) : (
          <div className="front-cover-middle-placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="front-cover-footer">
        <div className="front-cover-footer-item front-cover-footer-left">{publisherMark}</div>
        <div className="front-cover-footer-item front-cover-footer-right">{excellenceMark}</div>
      </div>
    </div>
  );
}
