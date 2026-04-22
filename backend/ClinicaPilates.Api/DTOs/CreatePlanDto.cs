namespace ClinicaPilates.Api.DTOs;

public class CreatePlanDto
{
    public string Name { get; set; } = string.Empty;

    public string Periodicity { get; set; } = string.Empty;

    public int ClassesPerWeek { get; set; }

    public decimal Price { get; set; }
}