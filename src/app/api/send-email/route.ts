import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// For MVP, we'll use environment variable or default to demo mode
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface EmailRequest {
  to: string[]
  subject: string
  content: string
  metrics?: {
    mrr: number
    growth: number
    users: number
    retention: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequest = await request.json()
    const { to, subject, content, metrics } = body

    // For demo purposes, if no Resend API key is set, just return success
    if (!resend || !process.env.RESEND_API_KEY) {
      console.log('Demo mode: Email would be sent to:', to)
      console.log('Subject:', subject)
      console.log('Content:', content)
      
      return NextResponse.json({ 
        success: true, 
        message: 'Demo mode: Email sending simulated',
        emailsSent: to.length 
      })
    }

    // Create HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Snowball Update</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
            .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
            .metric { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
            .metric-value { font-size: 28px; font-weight: bold; color: #3B82F6; }
            .metric-label { font-size: 14px; color: #6B7280; margin-top: 5px; }
            .content { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; color: #6B7280; font-size: 14px; margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">❄️ Snowball</div>
              <p>Investor Update</p>
            </div>
            
            <h1>${subject}</h1>
            
            ${metrics ? `
              <div class="metrics">
                <div class="metric">
                  <div class="metric-value">$${Math.round(metrics.mrr / 1000)}K</div>
                  <div class="metric-label">Monthly Recurring Revenue</div>
                </div>
                <div class="metric">
                  <div class="metric-value">+${metrics.growth}%</div>
                  <div class="metric-label">Month-over-Month Growth</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${metrics.users.toLocaleString()}</div>
                  <div class="metric-label">Active Users</div>
                </div>
                <div class="metric">
                  <div class="metric-value">${metrics.retention}%</div>
                  <div class="metric-label">User Retention</div>
                </div>
              </div>
            ` : ''}
            
            <div class="content">
              ${content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
            
            <div class="footer">
              <p>This update was sent via the Snowball platform.</p>
              <p>Visit <a href="https://joinsnowball.io">joinsnowball.io</a> to learn more about our two-sided marketplace for startups and investors.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Send emails to all recipients
    const emailPromises = to.map(email =>
      resend.emails.send({
        from: 'Snowball <updates@joinsnowball.io>',
        to: email,
        subject: subject,
        html: htmlContent,
      })
    )

    await Promise.all(emailPromises)

    return NextResponse.json({ 
      success: true, 
      message: 'Emails sent successfully',
      emailsSent: to.length 
    })

  } catch (error) {
    console.error('Email sending error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send emails' 
    }, { status: 500 })
  }
}
