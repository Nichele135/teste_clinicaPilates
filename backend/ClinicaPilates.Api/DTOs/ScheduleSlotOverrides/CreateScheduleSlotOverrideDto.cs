namespace ClinicaPilates.Api.DTOs.ScheduleSlotOverrides;

public class CreateScheduleSlotOverrideDto
{
    public int ScheduleSlotId { get; set; }

    public DateTime Date { get; set; }

    public bool IsActive { get; set; } = true;

    public int? MaxStudents { get; set; }

    public string? Notes { get; set; }
}