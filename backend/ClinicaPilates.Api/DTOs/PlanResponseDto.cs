namespace ClinicaPilates.Api.DTOs;

public class PlanResponseDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Periodicity { get; set; } = string.Empty;

    public int ClassesPerWeek { get; set; }

    public decimal Price { get; set; }

    public bool IsActive { get; set; }
}