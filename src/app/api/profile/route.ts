import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Service-role client — bypasses RLS
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.json()
  const { existingRowId, ...profileData } = body

  let data, error

  if (existingRowId) {
    // Update the existing row — never create duplicates
    ;({ data, error } = await adminClient
      .from('brand_profiles')
      .update(profileData)
      .eq('id', existingRowId)
      .select()
      .single())
  } else {
    // First-time save — insert one row
    ;({ data, error } = await adminClient
      .from('brand_profiles')
      .insert({ user_id: 'default', ...profileData })
      .select()
      .single())
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
