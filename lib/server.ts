import {createClient} from '@supabase/supabase-js';
import defaults from './defaults.json';
export function db(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false}})}
export async function settings(){const {data,error}=await db().from('settings').select('data').eq('id',1).single();if(error)throw error;return {...defaults,...data.data}}
export async function identity(req:Request){const token=req.headers.get('authorization')?.replace(/^Bearer /,'');if(!token)return null;const {data}=await db().auth.getUser(token);return data.user||null}
