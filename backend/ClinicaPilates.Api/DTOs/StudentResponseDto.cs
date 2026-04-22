namespace ClinicaPilates.Api.DTOs;

public class StudentResponseDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public DateTime StartDate { get; set; }
    public bool IsActive { get; set; }
    public string Notes { get; set; } = string.Empty;

//planos
    public int? PlanId { get; set; }

    public string PlanName { get; set; } = string.Empty;

    public string PlanPeriodicity { get; set; } = string.Empty;

    public int? ClassesPerWeek { get; set; }

    public decimal? PlanPrice { get; set; }
}