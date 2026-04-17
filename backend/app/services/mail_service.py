import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

def send_email(to: str, subject: str, html_body: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.MAIL_FROM
        msg["To"] = to
        msg.attach(MIMEText(html_body, "html"))
        with smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT) as server:
            server.starttls()
            server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
            server.sendmail(settings.MAIL_FROM, to, msg.as_string())
        print(f"✅ Email sent to {to}")
    except Exception as e:
        print(f"⚠️ Mail Error: {e}")

def send_status_update_email(to, ticket_id, title, description,
                              old_status, new_status, updated_by, ticket_url):
    subject = f"Ticket {ticket_id} status updated: {new_status.replace('_','-').title()}"

    status_colors = {
        "open": "#3b82f6",
        "in_progress": "#f59e0b",
        "resolved": "#10b981",
        "closed": "#6b7280"
    }
    color = status_colors.get(new_status, "#1a73e8")

    extra_note = ""
    if new_status == "resolved":
        extra_note = "<p style='border-left:4px solid #10b981;padding-left:12px;color:#555;'>Please review the resolution and let us know if you need anything else. You can close the ticket or reopen it if the issue persists.</p>"
    elif new_status == "closed":
        extra_note = "<p style='border-left:4px solid #6b7280;padding-left:12px;color:#555;'>This ticket has been closed. Thank you for using our support system.</p>"

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a73e8;">Ticket Status Updated</h2>
      <p>Your ticket status has been updated to <strong style="color:{color};">{new_status.replace('_',' ').title()}</strong>.</p>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#ddd;">
        <tr style="background:#f5f5f5;"><td><strong>Ticket ID</strong></td><td>{ticket_id}</td></tr>
        <tr><td><strong>Title</strong></td><td>{title}</td></tr>
        <tr style="background:#f5f5f5;"><td><strong>Description</strong></td><td>{description[:150]}...</td></tr>
        <tr><td><strong>Old Status</strong></td><td>{old_status.replace('_',' ').title()}</td></tr>
        <tr style="background:#f5f5f5;"><td><strong>New Status</strong></td><td><strong style="color:{color};">{new_status.replace('_',' ').title()}</strong></td></tr>
        <tr><td><strong>Updated By</strong></td><td>{updated_by}</td></tr>
      </table>
      <br/>
      {extra_note}
      <br/>
      <a href="{ticket_url}" style="background:#1a73e8;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">View Ticket</a>
      <br/><br/>
      <p style="color:gray;font-size:11px;">This e-mail and any attachments there to may contain confidential information and/or information protected by intellectual property rights for the exclusive attention of the intended addressees named above. If you have received this transmission in error, please immediately notify the sender by return e-mail and delete this message and its attachments. Unauthorized use, copying, or further full or partial distribution of this e-mail or its contents is prohibited.</p>
    </div>
    """
    send_email(to, subject, html)

def send_comment_email(to, ticket_id, title, comment, commented_by, ticket_url):
    subject = f"New Reply on Ticket {ticket_id}"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a73e8;">New Reply on Your Ticket</h2>
      <p><strong>{commented_by}</strong> has replied to your ticket.</p>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#ddd;">
        <tr style="background:#f5f5f5;"><td><strong>Ticket ID</strong></td><td>{ticket_id}</td></tr>
        <tr><td><strong>Title</strong></td><td>{title}</td></tr>
        <tr style="background:#f5f5f5;"><td><strong>Reply</strong></td><td>{comment}</td></tr>
      </table>
      <br/>
      <a href="{ticket_url}" style="background:#1a73e8;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">View Ticket</a>
      <br/><br/>
      <p style="color:gray;font-size:11px;">This e-mail and any attachments there to may contain confidential information and/or information protected by intellectual property rights for the exclusive attention of the intended addressees named above. If you have received this transmission in error, please immediately notify the sender by return e-mail and delete this message and its attachments. Unauthorized use, copying, or further full or partial distribution of this e-mail or its contents is prohibited.</p>
    </div>
    """
    send_email(to, subject, html)

def send_welcome_email(to, name, role, password):
    subject = "Welcome to Support Helpdesk - Your Account Details"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#1a73e8;">Welcome to Helpdesk!</h2>
      <p>Hi <strong>{name}</strong>, your account has been created by the Admin.</p>
      <table border="1" cellpadding="10" cellspacing="0" style="border-collapse:collapse;width:100%;border-color:#ddd;">
        <tr style="background:#f5f5f5;"><td><strong>Email</strong></td><td>{to}</td></tr>
        <tr><td><strong>Password</strong></td><td>{password}</td></tr>
        <tr style="background:#f5f5f5;"><td><strong>Role</strong></td><td>{role.title()}</td></tr>
      </table>
      <br/>
      <p style="color:red;"><strong>Please change your password after first login.</strong></p>
      <p style="color:gray;font-size:11px;">This is an automated notification from the Helpdesk System.</p>
    </div>
    """
    send_email(to, subject, html)

