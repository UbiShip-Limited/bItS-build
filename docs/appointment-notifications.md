# Appointment Notifications System

## Overview

The Bowen Island Tattoo Shop application leverages Square's built-in appointment notification system for automated confirmations and reminders, with additional capabilities for custom communications.

## How It Works

### Square Automatic Notifications

When appointments are synced to Square (via `SquareIntegrationService`), Square automatically handles:

1. **Appointment Confirmations** - Sent immediately when booking is created
2. **Appointment Reminders** - Sent 1 hour to 3 days before appointment (configurable in Square Dashboard)
3. **Rescheduling Notifications** - Sent when appointment time changes
4. **Cancellation Notifications** - Sent when appointment is cancelled

These notifications are sent via:
- Email (if customer email is provided)
- SMS (if customer phone is provided)
- Both (if both contact methods are available)

### Tracking Notifications

The system tracks all notification events through:

1. **Square Webhooks** - The app receives `booking.created` and `booking.updated` webhook events
2. **Audit Logs** - All notification events are logged with details about:
   - When Square sent the notification
   - What type of notification was sent
   - Customer information
   - Appointment details

### Notification Status API

Check notification status for any appointment:

```bash
GET /api/v1/appointments/:id/notifications
```

Returns:
- Whether Square notifications are enabled (appointment has `squareId`)
- Complete communication history from audit logs
- Details about each notification sent

### Custom Communications (CommunicationService)

Beyond Square's automatic notifications, the `CommunicationService` provides capabilities for:

1. **Custom Confirmation Messages** - Additional confirmations with shop-specific information
2. **Custom Reminder Schedules** - Reminders beyond Square's timing options
3. **Aftercare Instructions** - Post-appointment care instructions
4. **Marketing Communications** - Promotional messages (with opt-in)

**Note**: The CommunicationService requires email/SMS provider configuration (SendGrid, Twilio, etc.) to be functional.

## Configuration

### Square Dashboard Settings

1. Log into Square Dashboard
2. Navigate to Appointments > Communications
3. Configure:
   - Reminder timing (1 hour to 3 days before)
   - Confirmation timing (2 hours to 1 week before)
   - Message templates (email only, SMS uses default)
   - Enable/disable specific notification types

### Environment Variables

```env
# Square Webhook Configuration
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key

# Future: Email/SMS Providers (for custom communications)
SENDGRID_API_KEY=your_sendgrid_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## Implementation Status

✅ **Completed:**
- Square booking webhook handlers (`booking.created`, `booking.updated`)
- Notification tracking in audit logs
- API endpoint for notification status
- Basic CommunicationService structure

🔄 **Future Enhancements:**
- Email provider integration (SendGrid/AWS SES)
- SMS provider integration (Twilio/AWS SNS)
- Background job scheduler for custom reminders
- Customer communication preferences
- Notification templates management
- Bulk communication tools

## Best Practices

1. **Rely on Square for Standard Notifications** - Let Square handle basic confirmations and reminders
2. **Use Custom Communications for Special Cases** - Aftercare, follow-ups, marketing
3. **Always Track Opt-Outs** - Respect customer communication preferences
4. **Log Everything** - Maintain audit trail for all communications
5. **Test Webhook Handlers** - Ensure reliable webhook processing for notification tracking

## Troubleshooting

### Notifications Not Sending
1. Check Square Dashboard settings
2. Verify customer has email/phone in Square
3. Check webhook logs for `booking.created` events
4. Verify appointment has `squareId` (synced to Square)

### Webhook Issues
1. Verify `SQUARE_WEBHOOK_SIGNATURE_KEY` is set
2. Check server logs for webhook errors
3. Use Square webhook test tools
4. Monitor audit logs for webhook events

### Custom Communications Not Working
1. Verify email/SMS provider credentials
2. Check CommunicationService initialization
3. Review audit logs for communication attempts
4. Test with known-good email/phone numbers