"use client";

import Script from "next/script";

/** Camping Lodge's Elfsight Google Reviews embed. */
export default function GoogleReviews() {
  return (
    <section
      id="google-reviews"
      aria-labelledby="google-reviews-heading"
      className="section stack"
    >
      <p className="eyebrow">REAL CAMPER EXPERIENCES</p>
      <h2 id="google-reviews-heading">What our adventurers say</h2>
      <p className="muted">
        Read customer experiences and feedback from Google.
      </p>

      <div
        className="elfsight-app-9b762f57-5104-4f71-bcf1-76ed8710a338"
        data-elfsight-app-lazy
      />
      <Script
        src="https://elfsightcdn.com/platform.js"
        strategy="afterInteractive"
      />

      <a
        className="btn outline"
        href="https://maps.app.goo.gl/5e3xxy7PatQ4Cg3f8?g_st=ic"
        target="_blank"
        rel="noopener noreferrer"
      >
        View Camping Lodge on Google Maps ↗
      </a>
    </section>
  );
}
