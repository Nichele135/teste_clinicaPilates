namespace ClinicaPilates.Api.DTOs.Financial;

public class MonthlyPaymentResponseDto
{
    public int PaymentId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentPhone { get; set; } = string.Empty;

    public int ReferenceMonth { get; set; }
    public int ReferenceYear { get; set; }

    public string PlanName { get; set; } = string.Empty;
    public decimal PlanPrice { get; set; }

    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }

    public string? Notes { get; set; }
}