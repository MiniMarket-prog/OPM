"use server"

import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { Gender } from "@/lib/types"
import type { Database } from "@/lib/database.types"

// Ensure 'name' is the correct column in your 'profiles' table for the user's display name.
// And 'actual_salary' is now expected to be in the schema.
const ProfileUpdateSchema = z.object({
  name: z.string().min(1, "Name is required.").optional().or(z.literal("")),
  avatar_url: z.string().url("Invalid URL format.").optional().or(z.literal("")),
  entry_date: z.string().optional().or(z.literal("")),
  age: z.preprocess(
    (val: unknown) => (String(val).trim() === "" ? undefined : Number(val)),
    z.number().int().positive("Age must be a positive number.").optional(),
  ),
  address: z.string().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  actual_salary: z.preprocess(
    // This should now match the DB column
    (val: unknown) => (String(val).trim() === "" ? undefined : Number(val)),
    z.number().nonnegative("Salary cannot be negative.").optional(),
  ),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say", ""]).optional(),
})

export async function updateMailerProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient({
    get: (name: string) => cookieStore.get(name)?.value,
    set: (name: string, value: string, options: any) => {
      cookieStore.set(name, value, options)
    },
    remove: (name: string, options: any) => {
      cookieStore.delete({ name, ...options })
    },
  })

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Authentication required.", success: false }
  }

  const rawData = {
    name: formData.get("name") as string,
    avatar_url: formData.get("avatarUrl") as string,
    entry_date: formData.get("entryDate") as string,
    age: formData.get("age") as string,
    address: formData.get("address") as string,
    phone: formData.get("phone") as string,
    actual_salary: formData.get("actualSalary") as string, // Key from FormData
    gender: formData.get("gender") as Gender | "",
  }

  const validationResult = ProfileUpdateSchema.safeParse(rawData)

  if (!validationResult.success) {
    return {
      error: validationResult.error.errors
        .map((e: z.ZodIssue) => `${e.path.join(".") || "field"}: ${e.message}`)
        .join(", "),
      success: false,
    }
  }

  const validatedData = validationResult.data
  // Ensure keys in profileUpdateData match your actual DB column names.
  const profileUpdateData: Partial<Database["public"]["Tables"]["profiles"]["Update"]> = {}

  if (validatedData.name !== undefined) {
    // @ts-ignore - assuming 'name' is correct, or adjust if type is more specific
    profileUpdateData.name = validatedData.name === "" ? null : validatedData.name
  }
  if (validatedData.avatar_url !== undefined) {
    profileUpdateData.avatar_url = validatedData.avatar_url === "" ? null : validatedData.avatar_url
  }
  if (validatedData.entry_date !== undefined) {
    profileUpdateData.entry_date = validatedData.entry_date === "" ? null : validatedData.entry_date
  }
  if (validatedData.age !== undefined) profileUpdateData.age = validatedData.age

  if (validatedData.address !== undefined) {
    profileUpdateData.address = validatedData.address === "" ? null : validatedData.address
  }
  if (validatedData.phone !== undefined) {
    profileUpdateData.phone = validatedData.phone === "" ? null : validatedData.phone
  }
  // This is the critical part that was failing due to DB schema mismatch
  if (validatedData.actual_salary !== undefined) {
    profileUpdateData.actual_salary = validatedData.actual_salary
  }

  if (validatedData.gender !== undefined) {
    profileUpdateData.gender = validatedData.gender === "" ? null : (validatedData.gender as Gender)
  }

  if (Object.keys(profileUpdateData).length === 0) {
    const { data: currentProfileData } = await supabase
      .from("profiles")
      .select(`*, teams!fk_profiles_team_id(name)`)
      .eq("id", user.id)
      .single()
    return { message: "No changes detected.", success: true, updatedProfile: currentProfileData }
  }

  const { error: updateError } = await supabase.from("profiles").update(profileUpdateData).eq("id", user.id)

  if (updateError) {
    console.error("Supabase update error:", updateError)
    // Provide a more specific error if it's about the column again
    if (updateError.message.includes("column") && updateError.message.includes("does not exist")) {
      return { error: `Failed to update profile: Database schema error. ${updateError.message}`, success: false }
    }
    return { error: `Failed to update profile: ${updateError.message}`, success: false }
  }

  const { data: updatedProfileData, error: fetchError } = await supabase
    .from("profiles")
    .select(`*, teams!fk_profiles_team_id(name)`)
    .eq("id", user.id)
    .single()

  if (fetchError) {
    console.error("Supabase fetch after update error:", fetchError)
    revalidatePath("/mailer/profile")
    revalidatePath("/dashboard")
    return { message: "Profile updated, but failed to fetch latest data.", success: true }
  }

  revalidatePath("/mailer/profile")
  revalidatePath("/dashboard")
  return {
    message: "Profile updated successfully!",
    success: true,
    updatedProfile: updatedProfileData,
  }
}
