namespace ClinicaPilates.Api.Models;

public class PaymentReminderLog
{
    public int Id { get; set; }

    public int StudentPaymentId { get; set; }
    public StudentPayment? StudentPayment { get; set; }

    public int ReferenceMonth { get; set; }
    public int ReferenceYear { get; set; }

    public string Email { get; set; } = string.Empty;

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}