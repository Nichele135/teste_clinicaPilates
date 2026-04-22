namespace ClinicaPilates.Api.DTOs.Financial;

public class StudentPaymentHistoryDto
{
    public int PaymentId { get; set; }
    public int ReferenceMonth { get; set; }
    public int ReferenceYear { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public decimal PlanPrice { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public string? Notes { get; set; }
}