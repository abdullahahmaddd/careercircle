"""
Email service for sending notifications.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

from backend.config import get_settings

logger = logging.getLogger(__name__)


async def send_email(
    to_email: str,
    subject: str,
    body_text: str,
    body_html: Optional[str] = None
) -> bool:
    """
    Send an email notification.
    Returns True if successful, False otherwise.
    """
    settings = get_settings()
    
    if not settings.EMAIL_NOTIFICATIONS_ENABLED:
        logger.info(f"Email notifications disabled. Would send to {to_email}: {subject}")
        return False
    
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
        msg["To"] = to_email
        
        # Attach text version
        msg.attach(MIMEText(body_text, "plain"))
        
        # Attach HTML version if provided
        if body_html:
            msg.attach(MIMEText(body_html, "html"))
        
        # Send email
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


async def send_pod_invite_email(
    to_email: str,
    to_name: str,
    pod_name: str,
    inviter_name: str
) -> bool:
    """Send email notification for pod invite."""
    subject = f"You've been invited to join '{pod_name}' on CareerCircle"
    
    body_text = f"""
Hi {to_name},

{inviter_name} has invited you to join the peer pod "{pod_name}" on CareerCircle!

Peer pods allow you to collaborate with others, share resumes, and get valuable feedback on your job applications.

Log in to CareerCircle to view and accept this invitation:
{settings.FRONTEND_URL}/pods

Best,
The CareerCircle Team
"""

    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Pod Invitation</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{to_name}</strong>,</p>
            <p><strong>{inviter_name}</strong> has invited you to join the peer pod "<strong>{pod_name}</strong>" on CareerCircle!</p>
            <p>Peer pods allow you to collaborate with others, share resumes, and get valuable feedback on your job applications.</p>
            <a href="{settings.FRONTEND_URL}/pods" class="button">View Invitation</a>
            <div class="footer">
                <p>Best,<br>The CareerCircle Team</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    return await send_email(to_email, subject, body_text, body_html)


async def send_resume_comment_email(
    to_email: str,
    to_name: str,
    commenter_name: str,
    resume_name: str,
    comment_preview: str,
    pod_name: str
) -> bool:
    """Send email notification for new resume comment."""
    subject = f"New comment on your resume in '{pod_name}'"
    
    # Truncate comment preview
    if len(comment_preview) > 100:
        comment_preview = comment_preview[:100] + "..."
    
    body_text = f"""
Hi {to_name},

{commenter_name} left a comment on the resume "{resume_name}" in the pod "{pod_name}":

"{comment_preview}"

Log in to CareerCircle to view the full comment and respond:
{settings.FRONTEND_URL}/pods

Best,
The CareerCircle Team
"""

    body_html = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
        .content {{ background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .comment-box {{ background: white; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; border-radius: 4px; }}
        .button {{ display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }}
        .footer {{ margin-top: 20px; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💬 New Comment</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{to_name}</strong>,</p>
            <p><strong>{commenter_name}</strong> left a comment on the resume "<strong>{resume_name}</strong>" in the pod "<strong>{pod_name}</strong>":</p>
            <div class="comment-box">
                <p>"{comment_preview}"</p>
            </div>
            <a href="{settings.FRONTEND_URL}/pods" class="button">View Comment</a>
            <div class="footer">
                <p>Best,<br>The CareerCircle Team</p>
            </div>
        </div>
    </div>
</body>
</html>
"""
    
    return await send_email(to_email, subject, body_text, body_html)
