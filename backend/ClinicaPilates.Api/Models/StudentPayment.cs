namespace ClinicaPilates.Api.Models;

public class StudentPayment
{
    public int Id { get; set; }

    public int StudentId { get; set; }
    public Student? Student { get; set; }

    public int ReferenceMonth { get; set; }
    public int ReferenceYear { get; set; }

    // Foto do plano naquele mês
    public string PlanName { get; set; } = string.Empty;
    public decimal PlanPrice { get; set; }

    // Pending | Paid
    public string Status { get; set; } = "Pending";

    public DateTime? PaidAt { get; set; }

    public string? Notes { get; set; }
}