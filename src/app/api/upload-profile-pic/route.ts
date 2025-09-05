import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const teamMemberId = formData.get('teamMemberId') as string
    const userId = formData.get('userId') as string
    const memberName = formData.get('memberName') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!teamMemberId) {
      return NextResponse.json({ error: 'No team member ID provided' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'profile-pics')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename with proper extension
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const fileName = `${teamMemberId}-${Date.now()}.${fileExtension}`
    const filePath = join(uploadsDir, fileName)

    // Get existing team member to find old photo
    const supabase = await createClient()
    const { data: existingMember } = await supabase
      .from('company_teams')
      .select('profile_picture_url')
      .eq('user_id', userId)
      .eq('name', memberName)
      .single()

    // Delete old photo if it exists
    if (existingMember?.profile_picture_url) {
      const oldFileName = existingMember.profile_picture_url.split('/').pop()
      if (oldFileName) {
        const oldFilePath = join(uploadsDir, oldFileName)
        if (existsSync(oldFilePath)) {
          try {
            await unlink(oldFilePath)
          } catch (error) {
            console.warn('Failed to delete old photo:', error)
          }
        }
      }
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update database with new photo URL
    const publicUrl = `/uploads/profile-pics/${fileName}`
    
    const { error: updateError } = await supabase
      .from('company_teams')
      .update({ profile_picture_url: publicUrl })
      .eq('user_id', userId)
      .eq('name', memberName)

    if (updateError) {
      // If database update fails, clean up the uploaded file
      try {
        await unlink(filePath)
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError)
      }
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      fileName 
    })

  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
