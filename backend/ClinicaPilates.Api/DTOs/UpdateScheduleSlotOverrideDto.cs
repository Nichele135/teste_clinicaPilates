namespace ClinicaPilates.Api.DTOs;

public class UpdateScheduleSlotOverrideDto
{
    public bool IsActive { get; set; } = true;
    public int MaxStudents { get; set; }
    public string? Notes { get; set; }
}