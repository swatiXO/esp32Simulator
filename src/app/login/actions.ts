"use server";
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return redirect('/login?message=Could not authenticate user');
  }
  return redirect('/dashboard');
}

export async function signUp(formData: FormData) {
  const host = headers().get('host') ?? 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {

    return redirect(
      `/login?message=${encodeURIComponent(error.message)}`
    );
  }

  return redirect(
    '/login?message=Check email to continue sign in process'
  );
}

export async function signInWithGoogle() {
  const host = headers().get('host') ?? 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return redirect('/login?message=OAuth%20error');
  }
  if (data?.url) {
    return redirect(data.url);
  }
  return redirect('/login?message=OAuth%20failed');
}

export async function signInWithGithub() {
  const host = headers().get('host') ?? 'localhost:3000';
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const origin = `${protocol}://${host}`;
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) {
    return redirect('/login?message=OAuth%20error');
  }
  if (data?.url) {
    return redirect(data.url);
  }
  return redirect('/login?message=OAuth%20failed');
}
