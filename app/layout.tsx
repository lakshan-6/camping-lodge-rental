import './globals.css';import type {Metadata} from 'next';import {settings} from '../lib/server';import defaults from '../lib/defaults.json';
export async function generateMetadata():Promise<Metadata>{const s=await settings().catch(()=>defaults);return {title:s.name+' | Camping Gear Rentals',description:s.seo,icons:s.logo,openGraph:{title:s.name,description:s.seo,images:[s.hero]}}}
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
