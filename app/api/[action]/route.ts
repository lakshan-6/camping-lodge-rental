import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import nodemailer from 'nodemailer';
import type { User } from '@supabase/supabase-js';
import { db, identity, settings } from '../../../lib/server';
import seed from '../../../lib/seed.json';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ action: string }> };
type AdminRole = 'Owner' | 'Staff';

const adminTables = [
  'catalog', 'categories', 'packages', 'guides', 'orders',
  'profiles', 'messages', 'subscribers', 'roles',
] as const;
const textField = z.string().trim().min(1).max(500);
const phoneField = z.string().regex(/^[+\d ()-]{7,20}$/);
const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function ok(data: unknown) { return NextResponse.json(data); }
function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
function checked<T extends { data: any; error: any }>(result: T): T['data'] {
  if (result.error) {
    const e = result.error;
    throw new Error(`Database error ${e.code ?? ''}: ${e.message}`.trim());
  }
  return result.data;
}

// This function only reads roles. It never trusts a role sent from the browser.
async function role(user: User | null): Promise<AdminRole | null> {
  if (!user) return null;
  const { data, error } = await db()
    .from('roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) {
    console.error('[ADMIN] Role database lookup failed:', error.code, error.message);
    throw new Error(`Admin role lookup error (${error.code}): ${error.message}`);
  }
  if (!data || (data.role !== 'Owner' && data.role !== 'Staff')) {
    console.warn('[ADMIN] No Owner/Staff role for authenticated user');
    return null;
  }
  return data.role;
}

function responseError(error: unknown) {
  if (error instanceof ZodError) return fail('Invalid submission: ' + error.issues[0]?.message, 400);
  const message = error instanceof Error ? error.message : 'Unexpected request error';
  console.error('[API]', message);
  // Never send provider error internals or credentials to a public browser in production.
  return fail(process.env.NODE_ENV === 'production' ? 'Request failed. Please contact support.' : message, 500);
}

export async function GET(req: Request, { params }: Context) {
  try {
    const { action } = await params;
    if (action === 'public') {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return ok({ ...seed, demo: true });
      }
      const client = db();
      const s = await settings();
      const entries = await Promise.all(
        (['catalog', 'categories', 'packages', 'guides'] as const).map(async table => {
          const query = client.from(table).select('*');
          const result = table === 'categories' ? await query : await query.eq('active', true);
          return [table, checked(result)] as const;
        }),
      );
      return ok({ settings: s, ...Object.fromEntries(entries), demo: false });
    }

    if (action === 'reviews') {
      const s = await settings();
      if (!s.place_id || !process.env.GOOGLE_PLACES_API_KEY) return ok({ reviews: [] });
      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(s.place_id)}`, {
        headers: {
          'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'rating,userRatingCount,reviews,googleMapsUri',
        },
        next: { revalidate: 3600 },
      });
      if (!res.ok) return ok({ reviews: [] });
      const result = await res.json();
      const hidden: string[] = Array.isArray(s.hidden_reviews) ? s.hidden_reviews : [];
      return ok({ ...result, reviews: (result.reviews ?? []).filter((review: any) => !hidden.includes(review.name)) });
    }

    const user = await identity(req);
    if (!user) return fail('Sign in first', 401);
    const client = db();

    if (action === 'account') {
      // Verify the role separately; never misreport a profile-table error as Forbidden.
      const userRole = await role(user);
      const [profile, orders, favorites] = await Promise.all([
        client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        client.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        client.from('favorites').select('item_id').eq('user_id', user.id),
      ]);
      return ok({ profile: checked(profile), orders: checked(orders), favorites: checked(favorites), role: userRole });
    }

    if (action === 'admin') {
      const userRole = await role(user);
      if (!userRole) return fail('Admin access requires an assigned Owner or Staff role', 403);
      const entries = await Promise.all(
        adminTables.filter(table => table !== 'roles' || userRole === 'Owner')
          .map(async table => [table, checked(await client.from(table).select('*'))] as const),
      );
      return ok({ role: userRole, settings: await settings(), ...Object.fromEntries(entries) });
    }
    return fail('Not found', 404);
  } catch (error) { return responseError(error); }
}

export async function POST(req: Request, { params }: Context) {
  try {
    const { action } = await params;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return fail('Connect Supabase to enable submissions', 503);
    }
    const client = db();
    const user = await identity(req);

    if (action === 'upload') {
      if (!(await role(user))) return fail('Forbidden', 403);
      const file = (await req.formData()).get('file');
      if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5_000_000) {
        return fail('Choose JPEG, PNG or WebP under 5 MB');
      }
      const path = `${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      checked(await client.storage.from('gear').upload(path, file, { contentType: file.type }));
      return ok({ url: client.storage.from('gear').getPublicUrl(path).data.publicUrl });
    }

    const body = await req.json();
    if (body.website) return fail('Invalid submission');

    if (action === 'contact') {
      const values = z.object({
        name: textField,
        phone: phoneField.optional().or(z.literal('')),
        email: z.string().email(),
        subject: textField,
        message: z.string().min(1).max(5000),
      }).parse(body);
      checked(await client.from('messages').insert(values));
      let emailed = false;
      if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
        try {
          const port = Number(process.env.SMTP_PORT || 465);
          await nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com', port,
            secure: port === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
          }).sendMail({
            from: process.env.SMTP_USER,
            to: (await settings()).email,
            replyTo: values.email,
            subject: `Camping Lodge: ${values.subject}`,
            text: JSON.stringify(values, null, 2),
          });
          emailed = true;
        } catch (error) { console.error('[EMAIL] Contact notification failed:', error); }
      }
      return ok({ saved: true, emailed });
    }

    if (action === 'subscribe') {
      checked(await client.from('subscribers').insert(z.object({ name: textField, contact: textField }).parse(body)));
      return ok({ saved: true });
    }

    if (action === 'checkout') {
      const values = z.object({
        name: textField, phone: phoneField, pickup: dateField, return_date: dateField,
        delivery: z.boolean(), address: z.string().max(1000), notes: z.string().max(2000),
        cart: z.array(z.object({
          id: z.string().uuid(), kind: z.enum(['item', 'package']), quantity: z.number().int().min(1).max(100),
        })).min(1).max(100),
      }).parse(body);
      const days = (Date.parse(values.return_date) - Date.parse(values.pickup)) / 86_400_000;
      const todaySriLanka = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(new Date());
      if (!Number.isInteger(days) || days < 1 || days > 90 || values.pickup < todaySriLanka || (values.delivery && !values.address.trim())) {
        return fail('Invalid rental dates or delivery address');
      }
      const items = checked(await client.from('catalog').select('*').eq('active', true));
      const packages = checked(await client.from('packages').select('*').eq('active', true));
      const lines: any[] = [];
      const labels: string[] = [];
      let total = 0;
      for (const cartItem of values.cart) {
const product = (cartItem.kind === 'item' ? items ?? [] : packages ?? [])
  .find((entry: any) => entry.id === cartItem.id);
        if (!product) return fail('Item unavailable');
        const rate = Number(product.price);
        if (!Number.isFinite(rate) || rate < 0) return fail('Invalid item price');
        const lineTotal = rate * cartItem.quantity * days;
        total += lineTotal;
        labels.push(`${labels.length + 1}. ${product.name} x${cartItem.quantity} – Rs.${rate} x ${days} days = Rs.${lineTotal}`);
        const components = cartItem.kind === 'item' ? [{ item_id: product.id, quantity: 1 }] : product.items;
        if (!Array.isArray(components)) return fail('Invalid package contents');
        for (const component of components) {
          const item = (items ?? []).find(
  (entry: any) => entry.id === component.item_id
);
          if (!item) return fail('Package item unavailable');
          const quantity = Number(component.quantity) * cartItem.quantity;
          if (!Number.isInteger(quantity) || quantity < 1) return fail('Invalid package quantity');
          lines.push({ item_id: component.item_id, quantity, name: item.name,
            source: product.name, kind: cartItem.kind, source_id: product.id });
        }
      }
      const s = await settings();
      if (values.delivery) total += Number(s.delivery_charge || 0);
      if (s.deposit_enabled) total += Number(s.deposit || 0);
      const { cart: _cart, ...details } = values;
      // Database RPC performs date-overlap and stock checks atomically.
      const order = checked(await client.rpc('book', { p: { ...details, user_id: user?.id ?? null, lines, total } }));
      const message = [
        `Hello ${s.name}! I'd like to place a rental order.`,
        `Order: CL-${order.number}`, `Name: ${values.name}`, `Phone: ${values.phone}`,
        `Pickup: ${values.pickup} | Return: ${values.return_date}`, 'Items:', ...labels,
        `Delivery: Rs.${values.delivery ? s.delivery_charge : 0}`,
        `Refundable deposit: Rs.${s.deposit_enabled ? s.deposit : 0}`,
        `TOTAL: Rs.${total}`, 'Please confirm availability. Thank you!',
      ].join('\n');
      return ok({ number: order.number, total,
        url: `https://wa.me/${String(s.whatsapp).replace(/\D/g, '')}?text=${encodeURIComponent(message)}` });
    }

    if (!user) return fail('Sign in first', 401);
    if (action === 'profile') {
      const values = z.object({ name: textField, phone: phoneField, address: z.string().max(1000) }).parse(body);
      checked(await client.from('profiles').upsert({ ...values, id: user.id }));
      return ok({ saved: true });
    }
    if (action === 'favorite') {
      const itemId = z.string().uuid().parse(body.id);
      if (body.remove) checked(await client.from('favorites').delete().eq('user_id', user.id).eq('item_id', itemId));
      else checked(await client.from('favorites').upsert({ user_id: user.id, item_id: itemId }));
      return ok({ saved: true });
    }

    const userRole = await role(user);
    if (!userRole) return fail('Forbidden', 403);
    if (action === 'settings') {
      if (userRole !== 'Owner') return fail('Owner only', 403);
      checked(await client.from('settings').upsert({ id: 1, data: body }));
      return ok({ saved: true });
    }
    if (action === 'manage') {
      const table = z.enum(['catalog', 'categories', 'packages', 'guides', 'orders', 'messages', 'roles']).parse(body.table);
      if (table === 'roles' && userRole !== 'Owner') return fail('Owner only', 403);
      if (table === 'orders') {
        checked(await client.rpc('change_status', {
          p_id: z.string().uuid().parse(body.id),
          p_status: z.enum(['Pending', 'Confirmed', 'Picked up', 'Returned', 'Cancelled']).parse(body.data?.status),
        }));
      } else if (table === 'roles') {
        const id = z.string().uuid().parse(body.id);
        if (body.remove) {
          // Prevent deleting your own last Owner role accidentally.
          if (id === user.id) return fail('You cannot remove your own Owner access', 400);
          checked(await client.from('roles').delete().eq('user_id', id));
        } else {
          const values = z.object({ user_id: z.string().uuid(), role: z.enum(['Owner', 'Staff']) }).parse(body.data);
          checked(await client.from('roles').upsert(values));
        }
      } else if (body.remove) {
        checked(await client.from(table).delete().eq('id', z.string().uuid().parse(body.id)));
      } else {
        checked(await client.from(table).upsert({ ...body.data, ...(body.id ? { id: z.string().uuid().parse(body.id) } : {}) }));
      }
      return ok({ saved: true });
    }
    return fail('Not found', 404);
  } catch (error) { return responseError(error); }
}
