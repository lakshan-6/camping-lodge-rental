'use client';
import {useEffect,useState} from 'react';
const slides = [
 {src:'/hero/camp-1.jpg',name:'Into the forest',alt:'Lantern-lit tent among misty green trees'},
 {src:'/hero/camp-2.jpg',name:'Above the clouds',alt:'Camping tent overlooking forested hills at sunrise'},
 {src:'/hero/camp-3.jpg',name:'Under the stars',alt:'Warm tent and campfire in a woodland at dusk'}
];
export function AdventureVisual({customHero}:{customHero?:string}){
 const images=customHero&&customHero!=='/hero.svg'?[{src:customHero,name:'Camping Lodge',alt:'Camping Lodge featured outdoor image'},...slides]:slides;
 const [index,setIndex]=useState(0); const [paused,setPaused]=useState(false); const [reduced,setReduced]=useState(true);
 const [hidden,setHidden]=useState(false);
 useEffect(()=>{const media=window.matchMedia('(prefers-reduced-motion: reduce)'); const update=()=>setReduced(media.matches); const visibility=()=>setHidden(document.hidden);update();visibility();media.addEventListener('change',update);document.addEventListener('visibilitychange',visibility);return()=>{media.removeEventListener('change',update);document.removeEventListener('visibilitychange',visibility)}},[]);
 const count=images.length; const active=index%count;
 useEffect(()=>{if(paused||reduced||hidden)return;const timer=window.setTimeout(()=>setIndex((active+1)%count),6500);return()=>window.clearTimeout(timer)},[active,count,paused,reduced,hidden]);
 const go=(i:number)=>setIndex((i+count)%count);
 return <div className="photo-stage" role="region" aria-label="Camping inspiration slideshow">
 <div className="photo-layers">{images.map((slide,i)=><div key={slide.src} className={'photo-slide'+(i===active?' is-current':'')} aria-hidden={i!==active}><img src={slide.src} alt={slide.alt} loading="eager" decoding="async" fetchPriority={i===0?'high':'low'}/></div>)}</div>
 <div className="photo-shade"/>
 <div className="photo-caption"><span>FIELD NOTES / {String(active+1).padStart(2,'0')}</span><strong>{images[active].name}</strong></div>
 <div className="photo-controls" aria-label="Slideshow controls"><button type="button" onClick={()=>go(active-1)} aria-label="Previous image">‹</button><div className="photo-dots">{images.map((slide,i)=><button type="button" key={slide.src} aria-label={'Show '+slide.name} aria-pressed={i===active} onClick={()=>go(i)} className={i===active?'active':''}/>)}</div><button type="button" onClick={()=>go(active+1)} aria-label="Next image">›</button>{!reduced&&<button type="button" onClick={()=>setPaused(v=>!v)} aria-label={paused?'Play slideshow':'Pause slideshow'}>{paused?'▶':'Ⅱ'}</button>}</div>
 </div>
}
const paths:Record<string,string>={Tents:'M3 19 12 4l9 15H3Zm9-15v15m0-7-4 7', 'Sleeping Bags':'M8 7a4 4 0 0 1 8 0v13H8V7Zm0 5h8m-8 4h8', 'Cooking Gear':'M4 13h16l-2 7H6l-2-7Zm-2 0h20M9 10c-3-3 3-4 0-7m6 7c-3-3 3-4 0-7', Lighting:'M9 3h6v4l4 4v9H5v-9l4-4V3Zm-4 9h14m-7 0v8', Backpacks:'M8 7V5a4 4 0 0 1 8 0v2M6 7h12l2 13H4L6 7Zm2 7h8v6', Furniture:'M5 3v10h14M5 13l-2 8m14-8 3 8M7 8h10v5', Accessories:'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4 6-2 6-6 2 2-6 6-2Z'};
export function GearIcon({category,className=''}:{category?:string,className?:string}){return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[category||'']||paths.Tents}/></svg>}
