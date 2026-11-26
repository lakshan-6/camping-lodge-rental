import type {ReactNode} from 'react';
export function BrandIcon({name}:{name:string}){const paths:Record<string,ReactNode>={whatsapp:<path fill="currentColor" stroke="none" d="M12.04 2a9.9 9.9 0 0 0-8.56 14.86L2 22l5.28-1.38A10 10 0 1 0 12.04 2Zm0 18.2a8.3 8.3 0 0 1-4.23-1.16l-.3-.18-3.13.82.84-3.05-.2-.32a8.21 8.21 0 1 1 7.02 3.89Zm4.5-6.16c-.25-.12-1.47-.72-1.7-.8-.23-.08-.39-.12-.56.13-.16.25-.64.8-.79.96-.14.17-.29.19-.54.07-.25-.13-1.05-.39-2-1.24-.74-.66-1.24-1.48-1.39-1.73-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.89 2.42 1.02 2.58c.12.17 1.75 2.68 4.24 3.76.59.25 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.3Z"/>,facebook:<path fill="currentColor" stroke="none" d="M14 21v-8h3l.5-3H14V8c0-.9.3-1.5 1.6-1.5H18V3.7c-.5-.1-1.4-.2-2.6-.2-2.7 0-4.5 1.6-4.5 4.6V10H8v3h2.9v8z"/>,instagram:<><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.7 6.4h.01" strokeWidth="3"/></>,tiktok:<path fill="currentColor" stroke="none" d="M15 3h3c.3 2.4 1.6 3.8 4 4v3a8 8 0 0 1-4-1.2v7a5.7 5.7 0 1 1-5.7-5.7h.8v3h-.8a2.7 2.7 0 1 0 2.7 2.7z"/>,pin:<><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,phone:<path d="M8 3H5c-1 0-2 1-2 2 0 9 7 16 16 16 1 0 2-1 2-2v-3l-5-2-2 2a13 13 0 0 1-6-6l2-2Z"/>,mail:<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,up:<path d="m6 15 6-6 6 6"/>};return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]||paths.arrow}</svg>}
const socials=[['facebook','Facebook'],['instagram','Instagram'],['tiktok','TikTok']];
export function SocialBadges({s}:{s:any}){return <div className="social-badges">{socials.filter(([k])=>s[k]).map(([k,n])=><a className={'social-badge '+k} key={k} href={s[k]} target="_blank" rel="noopener noreferrer"><BrandIcon name={k}/><span>{n}</span></a>)}</div>}
export function ContactDetails({s}:{s:any}){return <div className="contact-detail-list">{[['pin','Location',s.address,null],['clock','Opening hours',s.hours,null],['phone','Call us',s.phone,'tel:'+s.phone],['mail','Email us',s.email,'mailto:'+s.email]].map(([icon,label,value,href])=><div className="contact-detail" key={label}><span className="detail-icon"><BrandIcon name={icon!}/></span><div><span className="detail-label">{label}</span>{href?<a href={href}>{value}</a>:<p>{value}</p>}</div></div>)}</div>}

export function VisitSection({
  s,
  wa
}: {
  s: any;
  wa: (text?: string) => string;
}) {
  const mapUrl =
    s?.map_url ||
    "https://maps.app.goo.gl/5e3xxy7PatQ4Cg3f8";

  const phone = s?.phone || "0715524499";
  const email = s?.email || "campinglodge7@gmail.com";
  const location = s?.location || "Kandy, Sri Lanka";

  return (
    <section className="cl-visit">
      <div className="cl-visit-card">

        {/* Camping photo */}
        <div className="cl-visit-image">
          <img
            src="/hero/camp-2.jpg"
            alt="Camping Lodge outdoor adventure"
            loading="lazy"
          />
          <div className="cl-visit-shade" />

          <div className="cl-visit-photo-text">
            <span>YOUR NEXT ADVENTURE STARTS HERE</span>

            <h2>
              Find your way
              <br />
              to the <em>wild.</em>
            </h2>

            <p>Visit our camping gear rental base.</p>
          </div>
        </div>

        {/* Location content */}
        <div className="cl-visit-content">

          <span className="cl-visit-eyebrow">
            OUR LOCATION
          </span>

          <h2>
            Visit <em>Camping Lodge</em>
          </h2>

          <p className="cl-visit-description">
            Get in touch to arrange your equipment pickup
            or plan your next outdoor escape.
          </p>

          <div className="cl-visit-location">
            <span aria-hidden="true">📍</span>
            <span>{location}</span>
          </div>

          {/* Desktop information only */}
          <div className="cl-visit-details">
            <div>
              <strong>Opening hours</strong>
              <span>
                {s?.opening_hours ||
                  "Contact us for opening hours"}
              </span>
            </div>

            <div>
              <strong>Phone</strong>
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
                {phone}
              </a>
            </div>

            <div>
              <strong>Email</strong>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
          </div>

          <div className="cl-visit-actions">

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="cl-visit-directions"
            >
              <span>↗</span>
              Get directions
            </a>

            <a
              href={wa(
                "Hello Camping Lodge! I would like to ask about camping gear rental."
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="cl-visit-whatsapp"
              aria-label="Chat on WhatsApp"
              title="WhatsApp"
            >
              <BrandIcon name="whatsapp" />
            </a>

          </div>
        </div>
      </div>
    </section>
  );
}

export function PremiumFooter({s,wa}:{s:any,wa:(message:string)=>string}){return <footer className="foot premium-footer"><div className="wrap"><div className="footer-cta"><div><p className="eyebrow">THE OUTDOORS ARE CALLING</p><h2>Ready for your next <em>escape?</em></h2></div><a href="/rent" className="btn gold">Explore rental gear <BrandIcon name="arrow"/></a></div><div className="footer-columns"><div className="footer-brand"><a href="/" className="footer-logo"><img src={s.logo} alt={s.name}/><strong>{s.name}</strong></a><p>Gear up. Get outside. Discover more with camping equipment rentals in Sri Lanka.</p><SocialBadges s={s}/></div><div className="footer-links"><h3>Explore</h3><a href="/rent">Rental gear</a><a href="/packages">Packages</a>{s.guide&&<a href="/guide">Camping guides</a>}<a href="/buy">Buy equipment</a></div><div className="footer-links"><h3>Information</h3><a href="/about">About us</a><a href="/contact">Contact us</a><a href="/privacy">Privacy policy</a><a href="/refund">Refund policy</a></div><div className="footer-contact"><h3>Get in touch</h3><ContactDetails s={s}/><a className="footer-chat" href={wa('Hello Camping Lodge!')}><BrandIcon name="whatsapp"/> Chat on WhatsApp <BrandIcon name="arrow"/></a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {s.name}. All rights reserved.</span><span>Made for the outdoors · Sri Lanka</span><a href="#" aria-label="Back to top">Back to top <BrandIcon name="up"/></a></div></div></footer>}
